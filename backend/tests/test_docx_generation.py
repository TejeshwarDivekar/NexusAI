import os
import pytest
from app.services.document_generation import IEEEDocumentGenerator, IEEEDocumentValidator


def test_ieee_docx_generation_and_metadata(tmp_path):
    """Test generating a compliant IEEE Word document (.docx) from research data."""
    output_dir = str(tmp_path)
    task_id = "test-task-12345"
    query = "Evaluating memory efficiency in sub-4-bit KV-cache quantization for LLMs"
    
    mock_sources = [
        {
            "title": "Scalable Sub-4-Bit KV-Cache Quantization",
            "url": "https://arxiv.org/abs/2402.00001",
            "authors": ["Vaswani et al."],
            "publication_date": "2026",
            "reliability": 0.96
        },
        {
            "title": "High-Throughput Attention Architectures",
            "url": "https://arxiv.org/abs/2402.00002",
            "authors": ["Chen et al."],
            "publication_date": "2026",
            "reliability": 0.94
        }
    ]
    mock_evidence = [
        {
            "citation_id": "[1]",
            "source_title": "Scalable Sub-4-Bit KV-Cache Quantization",
            "source_url": "https://arxiv.org/abs/2402.00001",
            "fact_snippet": "Integer quantization reduces memory bandwidth pressure by 3.8x on A100 GPUs.",
            "confidence": "High (96%)"
        }
    ]
    mock_claims = [
        {
            "claim_text": "Integer quantization reduces memory bandwidth pressure",
            "confidence_score": 0.96,
            "claim_type": "source_supported"
        }
    ]
    mock_contradictions = [
        {
            "claim_a_text": "Quantization retains 99% accuracy",
            "claim_b_text": "Sub-4-bit exhibits 4% perplexity degradation under 128k context",
            "conflict_rationale": "Accuracy trade-off divergence under extended context",
            "severity": "potential"
        }
    ]

    meta = IEEEDocumentGenerator.generate_docx(
        task_id=task_id,
        query=query,
        report_markdown="# Report",
        sources=mock_sources,
        evidence_matrix=mock_evidence,
        claims=mock_claims,
        contradictions=mock_contradictions,
        output_dir=output_dir,
        version=1
    )

    assert meta["status"] == "success"
    assert os.path.exists(meta["file_path"])
    assert meta["file_size"] > 1000
    assert len(meta["sha256_hash"]) == 64
    assert meta["version"] == 1

    # Validate the generated document
    val_report = IEEEDocumentValidator.validate_docx(
        file_path=meta["file_path"],
        expected_sources_count=len(mock_sources)
    )

    assert val_report["is_valid"] is True
    assert "I. INTRODUCTION" in val_report["sections_found"]
    assert "II. RESEARCH QUESTION" in val_report["sections_found"]
    assert "REFERENCES" in val_report["sections_found"]
    assert val_report["references_count"] >= 2
    assert val_report["paragraphs_count"] > 10
    assert val_report["tables_count"] >= 1


def test_docx_download_api_endpoint(client):
    """Integration test verifying automatic DOCX creation and HTTP binary file download."""
    # 1. Run research task
    run_res = client.post("/api/v1/research/run", json={
        "query": "Quantum error correction thresholds in surface codes",
        "include_academic": True,
        "include_web": False,
        "depth": "fast"
    })
    assert run_res.status_code == 200
    task_data = run_res.json()
    task_id = task_data["task_id"]
    assert task_data["docx_download_url"] is not None

    # 2. Download generated IEEE Word doc
    download_res = client.get(f"/api/v1/research/tasks/{task_id}/document/download")
    assert download_res.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in download_res.headers["content-type"]
    assert len(download_res.content) > 1000

    # 3. List documents for task
    list_docs_res = client.get(f"/api/v1/research/tasks/{task_id}/documents")
    assert list_docs_res.status_code == 200
    docs_list = list_docs_res.json()
    assert len(docs_list) >= 1
    assert docs_list[0]["version"] == 1


def test_docx_regeneration_versioning(client):
    """Test document regeneration increments version and preserves history."""
    run_res = client.post("/api/v1/research/run", json={
        "query": "CRISPR-Cas9 high fidelity off-target specificity",
        "include_academic": True,
        "include_web": False,
        "depth": "fast"
    })
    assert run_res.status_code == 200
    task_id = run_res.json()["task_id"]

    # Regenerate document
    regen_res = client.post(f"/api/v1/research/tasks/{task_id}/document/regenerate")
    assert regen_res.status_code == 200
    regen_data = regen_res.json()
    assert regen_data["version"] == 2
    assert "download_url" in regen_data

    # Verify both v1 and v2 exist in task history
    docs_res = client.get(f"/api/v1/research/tasks/{task_id}/documents")
    assert docs_res.status_code == 200
    docs = docs_res.json()
    versions = [d["version"] for d in docs]
    assert 1 in versions
    assert 2 in versions
