import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.services.document_generation import (
    IEEEDocumentGenerator,
    AcademicPDFGenerator,
    IEEEDocumentValidator,
    CitationValidator,
    DocumentModelBuilder
)

def run_verification():
    print("==================================================================")
    print("NEXUSRESEARCH ACADEMIC DOCUMENT GENERATION SYSTEM VERIFICATION")
    print("==================================================================")

    query = "Applications of Artificial Intelligence and Computer Vision in Precision Agriculture"
    task_id = "task-verify-academic-001"
    
    mock_sources = [
        {
            "title": "Deep Learning and Multi-Spectral Computer Vision for Early Crop Disease Detection",
            "url": "https://doi.org/10.1016/j.compag.2024.108920",
            "doi": "10.1016/j.compag.2024.108920",
            "authors": ["Li, X.", "Zhang, W.", "Patel, A."],
            "publication_date": "2024",
            "source_type": "academic",
            "query_relevance": "HIGH",
            "relevance_score": 0.96
        },
        {
            "title": "Autonomous Drone-Based Variable-Rate Nitrogen Application Using Convolutional Neural Networks",
            "url": "https://arxiv.org/abs/2403.01120",
            "doi": "10.48550/arXiv.2403.01120",
            "authors": ["Kumar, R.", "O'Connor, S.", "Muller, H."],
            "publication_date": "2024",
            "source_type": "arxiv",
            "query_relevance": "HIGH",
            "relevance_score": 0.94
        },
        {
            "title": "Edge Computing and Transformer Architectures for Real-Time Weed Segmentation",
            "url": "https://pubmed.ncbi.nlm.nih.gov/38201944",
            "authors": ["Chen, Y.", "Al-Hassan, M."],
            "publication_date": "2025",
            "source_type": "pubmed",
            "query_relevance": "HIGH",
            "relevance_score": 0.91
        }
    ]

    mock_evidence = [
        {
            "source_id": 1,
            "claim_text": "YOLO-v8 and Vision Transformers achieved 97.4% precision in detecting apple scab under natural canopy lighting.",
            "exact_quote": "The fine-tuned Vision Transformer architecture attained a mean average precision (mAP@50) of 97.4% across diverse canopy illumination levels.",
            "confidence": "High (97.4%)"
        },
        {
            "source_id": 2,
            "claim_text": "Variable-rate fertilization guided by aerial computer vision reduced aggregate fertilizer runoff by 23.6%.",
            "exact_quote": "Field deployment across 120 hectares demonstrated a 23.6% reduction in nitrogen over-application compared to conventional uniform broadcasting.",
            "confidence": "High (94.0%)"
        },
        {
            "source_id": 3,
            "claim_text": "Edge-deployed quantized segmentation models execute at 32 FPS on embedded NVIDIA Jetson platforms.",
            "exact_quote": "INT8 quantized attention heads sustained real-time throughput of 32 frames per second with minimal power consumption on battery-constrained field units.",
            "confidence": "High (91.0%)"
        }
    ]

    mock_claims = [
        {
            "claim_text": "Vision Transformers improve precision agriculture accuracy",
            "confidence_score": 0.97,
            "claim_type": "source_supported"
        },
        {
            "claim_text": "Computer-vision guided spraying curtails environmental nitrogen runoff",
            "confidence_score": 0.94,
            "claim_type": "source_supported"
        }
    ]

    mock_contradictions = [
        {
            "claim_a_text": "Edge transformers achieve real-time weed segmentation on low-power hardware",
            "claim_b_text": "High-resolution spectral imagery requires cloud offloading under dense foliage conditions",
            "conflict_rationale": "Hardware processing throughput constraints vs image resolution trade-offs",
            "severity": "potential"
        }
    ]

    report_markdown = """
### 1. Introduction & Operational Context
Precision agriculture leverages computational intelligence, remote sensing, and robotics to optimize agricultural resource efficiency. Modern computer vision systems have transitioned from manual heuristic feature extraction to deep neural networks and vision transformers, enabling automated crop health monitoring, weed classification, and targeted pesticide application [1].

### 2. Deep Learning for Early Disease Phenotyping
Automated disease detection relies heavily on multispectral and RGB imagery captured via UAVs or ground robots. Vision transformer models demonstrate high resilience against ambient lighting variations, detecting foliar pathologies before visible necrosis occurs [1]. Controlled field trials have validated detection accuracies exceeding 97% across fruit and grain crops [1].

### 3. Aerial Sensing and Resource Optimization
Autonomous unmanned aerial vehicles equipped with calibrated optical sensors generate high-resolution vegetation index maps. By coupling these maps with variable-rate distribution equipment, agricultural operators achieve localized nutrient delivery, substantially reducing chemical wastage and downstream aquatic contamination [2].

### 4. Edge Computing Bottlenecks and Real-Time Execution
Deploying sophisticated neural network models on agricultural machinery introduces strict latency and thermal constraints. Recent advances in integer quantization (INT8) and attention head pruning allow real-time inference on edge accelerators mounted directly to tractor spray booms [3]. However, intense canopy occlusion can still demand hybrid edge-cloud processing pipelines [2].
"""

    summary_text = (
        "This investigation evaluates the application of deep learning and computer vision in precision agriculture. "
        "Analysis of empirical literature demonstrates that vision transformers achieve over 97% classification accuracy in foliar disease detection [1], "
        "while aerial variable-rate systems reduce chemical runoff by up to 23.6% [2]. Embedded edge quantization enables 32 FPS field inference [3]."
    )

    out_dir = "generated_docs"

    # 1. Test DOCX Generation
    print("\n[1/4] Compiling Academic IEEE Word (.docx)...")
    docx_meta = IEEEDocumentGenerator.generate_docx(
        task_id=task_id,
        query=query,
        report_markdown=report_markdown,
        sources=mock_sources,
        evidence_matrix=mock_evidence,
        claims=mock_claims,
        contradictions=mock_contradictions,
        summary=summary_text,
        author_name="Tejeshwar Divekar",
        output_dir=out_dir,
        version=1
    )
    print(f" -> Word file created: {docx_meta['file_name']} ({docx_meta['file_size']} bytes)")

    # 2. Validate DOCX
    print("\n[2/4] Validating DOCX compliance & citation grounding...")
    docx_val = IEEEDocumentValidator.validate_docx(
        file_path=docx_meta["file_path"],
        expected_sources_count=len(mock_sources)
    )
    print(f" -> DOCX Valid: {docx_val['is_valid']}")
    print(f" -> Sections found: {docx_val['sections_found']}")
    print(f" -> References counted: {docx_val['references_count']}")
    print(f" -> Citations counted: {docx_val['citations_found']}")
    assert docx_val["is_valid"] is True, f"DOCX Validation failed: {docx_val['errors']}"

    # 3. Test PDF Generation
    print("\n[3/4] Compiling Publication-Grade Academic PDF (.pdf)...")
    pdf_meta = AcademicPDFGenerator.generate_pdf(
        task_id=task_id,
        query=query,
        report_markdown=report_markdown,
        sources=mock_sources,
        evidence_matrix=mock_evidence,
        claims=mock_claims,
        contradictions=mock_contradictions,
        summary=summary_text,
        author_name="Tejeshwar Divekar",
        output_dir=out_dir,
        version=1
    )
    print(f" -> PDF file created: {pdf_meta['file_name']} ({pdf_meta['file_size']} bytes)")

    # 4. Validate PDF
    print("\n[4/4] Validating PDF binary structure...")
    pdf_val = IEEEDocumentValidator.validate_pdf(
        file_path=pdf_meta["file_path"],
        expected_sources_count=len(mock_sources)
    )
    print(f" -> PDF Valid: {pdf_val['is_valid']}")
    print(f" -> PDF Size: {pdf_val['file_size']} bytes")
    print(f" -> SHA256: {pdf_val['sha256'][:16]}...")
    assert pdf_val["is_valid"] is True, f"PDF Validation failed: {pdf_val['errors']}"

    print("\n==================================================================")
    print("SUCCESS: BOTH PDF AND DOCX DOCUMENTS ARE 100% PUBLICATION-READY!")
    print("==================================================================")

if __name__ == "__main__":
    run_verification()
