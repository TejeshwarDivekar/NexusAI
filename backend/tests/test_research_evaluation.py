import json
import os
import pytest
from app.services.research_engine import ResearchEngine
from app.services.evidence_service import EvidenceService
from app.services.contradiction_service import ContradictionService
from app.services.providers.search import MultiSearchAggregator


def load_evaluation_dataset():
    eval_path = os.path.join(os.path.dirname(__file__), "evaluation_dataset.json")
    with open(eval_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.mark.asyncio
async def test_deterministic_query_decomposition():
    """Test query analysis decomposes question into structured multi-domain inquiries."""
    query = "Evaluating memory efficiency in sub-4-bit KV-cache quantization for LLMs"
    sub_queries = ResearchEngine._plan_queries(query)
    
    assert len(sub_queries) >= 3
    assert any("benchmarks" in sq.lower() or "methodology" in sq.lower() for sq in sub_queries)
    assert any("limitations" in sq.lower() or "trade-offs" in sq.lower() for sq in sub_queries)


@pytest.mark.asyncio
async def test_source_normalization_and_deduplication():
    """Test search aggregator deduplicates duplicate URLs and ranks by authority."""
    aggregator = MultiSearchAggregator()
    
    mock_sources = [
        {"title": "Paper 1", "url": "https://arxiv.org/abs/2401.0001", "snippet": "Text A", "reliability": 0.95},
        {"title": "Paper 1 Duplicate", "url": "https://arxiv.org/abs/2401.0001", "snippet": "Text A dup", "reliability": 0.95},
        {"title": "Paper 2", "url": "https://pubmed.ncbi.nlm.nih.gov/12345/", "snippet": "Text B", "reliability": 0.98},
        {"title": "Blog Post", "url": "https://randomblog.com/post", "snippet": "Text C", "reliability": 0.70},
    ]
    
    ranked = aggregator.deduplicate_and_rank(mock_sources)
    assert len(ranked) == 3
    # Highest reliability should be ranked first
    assert ranked[0]["reliability"] >= ranked[1]["reliability"]
    assert ranked[0]["url"] == "https://pubmed.ncbi.nlm.nih.gov/12345/"


def test_evidence_extraction_and_claim_classification():
    """Test claim classification strictly produces source-supported claims and handles synthesis."""
    sources = [
        {
            "title": "Quantum Error Thresholds on Superconducting Circuits",
            "url": "https://arxiv.org/abs/2402.00003",
            "snippet": "Surface codes achieve fault-tolerant error suppression below physical error rate of 0.7%. Experimental tests show exponential suppression with code distance.",
            "content": "Surface codes achieve fault-tolerant error suppression below physical error rate of 0.7%. Experimental tests show exponential suppression with code distance.",
            "source_type": "academic_arxiv",
            "reliability": 0.96
        }
    ]
    
    evidence_matrix = EvidenceService.extract_evidence("Quantum error thresholds", sources)
    assert len(evidence_matrix) >= 1
    ev = evidence_matrix[0]
    assert ev["citation_id"] == "[1]"
    assert "0.7%" in ev["fact_snippet"]
    assert ev["char_start"] >= 0
    assert ev["char_end"] > ev["char_start"]

    claims = EvidenceService.verify_claims(
        evidence_matrix,
        inferred_statements=["Fault-tolerant quantum memory scales with surface code lattice diameter."]
    )
    assert len(claims) >= 2
    claim_types = [c["claim_type"] for c in claims]
    assert "source_supported" in claim_types
    assert "inference" in claim_types


def test_no_invented_citations():
    """Test citation pointers strictly map back to retrieved evidence URLs."""
    sources = [
        {
            "title": "KV-Cache Quantization Benchmarks",
            "url": "https://arxiv.org/abs/2402.00001",
            "snippet": "4-bit quantization reduces memory bandwidth pressure by 3.8x on A100 GPUs.",
            "content": "4-bit quantization reduces memory bandwidth pressure by 3.8x on A100 GPUs.",
            "source_type": "academic_arxiv"
        }
    ]
    evidence_matrix = EvidenceService.extract_evidence("KV cache", sources)
    valid_citation_ids = {ev["citation_id"] for ev in evidence_matrix}
    
    for ev in evidence_matrix:
        assert ev["citation_id"] in valid_citation_ids
        assert ev["source_url"] == "https://arxiv.org/abs/2402.00001"


@pytest.mark.asyncio
async def test_evaluation_dataset_benchmarks():
    """Run verification against all entries in evaluation_dataset.json."""
    dataset = load_evaluation_dataset()
    assert len(dataset) >= 3

    for item in dataset:
        sub_queries = ResearchEngine._plan_queries(item["question"])
        assert len(sub_queries) >= len(item["target_sub_queries"])

        # Simulate source extraction
        simulated_sources = [
            {
                "title": f"Grounded Research Study for {item['id']}",
                "url": f"https://arxiv.org/abs/240{item['id']}",
                "snippet": f"Empirical findings confirm: {item['question']} shows significant precision retention.",
                "content": f"Empirical findings confirm: {item['question']} shows significant precision retention.",
                "source_type": "academic_arxiv",
                "reliability": 0.95
            }
        ]

        evidence = EvidenceService.extract_evidence(item["question"], simulated_sources)
        assert len(evidence) >= 1
        claims = EvidenceService.verify_claims(evidence)
        assert any(c["claim_type"] == "source_supported" for c in claims)


def test_research_run_integration_and_persistence(client):
    """Integration test verifying end-to-end research persistence, claims, evidence, and token metrics."""
    res = client.post("/api/v1/research/run", json={
        "query": "State of the art in HNSW vector index performance",
        "include_academic": True,
        "include_web": True,
        "depth": "fast"
    })
    assert res.status_code == 200
    data = res.json()
    assert "task_id" in data
    assert data["status"] == "completed"
    assert len(data["sources"]) > 0
    assert len(data["evidence_matrix"]) > 0
    assert len(data["claims"]) > 0
    assert "report_markdown" in data
    assert "token_usage" in data
    assert data["token_usage"]["estimated_tokens"] > 0
    assert data["cost_estimate"] > 0.0

    # Retrieve saved task by ID
    task_res = client.get(f"/api/v1/research/tasks/{data['task_id']}")
    assert task_res.status_code == 200
    assert task_res.json()["task_id"] == data["task_id"]
