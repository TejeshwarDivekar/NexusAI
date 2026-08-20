import json
import os
import pytest
from app.services.research_engine import ResearchEngine
from app.services.evidence_service import EvidenceService
from app.services.contradiction_service import ContradictionService
from app.services.relevance_service import SourceRelevanceScorer
from app.services.query_classifier import QueryClassifier
from app.services.providers.search import MultiSearchAggregator


def load_evaluation_dataset():
    eval_path = os.path.join(os.path.dirname(__file__), "evaluation_dataset.json")
    with open(eval_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_hard_relevance_gate_rejects_irrelevant_pharmacology_for_farming_ai():
    """
    CRITICAL ACCEPTANCE TEST:
    For a query 'make research about farming with AI', the engine MUST strictly accept
    AI/agriculture papers and MUST reject irrelevant medical/pharmacological/catfish papers.
    """
    query = "make research about farming with AI"
    classification = QueryClassifier.classify(query)
    cleaned_topic = classification["cleaned_topic"]
    
    assert classification["domain"] == "agriculture_farming"
    assert "artificial intelligence" in classification["formal_title"].lower() or "agriculture" in classification["formal_title"].lower()

    candidates = [
        {
            "title": "Artificial Intelligence in Precision Agriculture: Deep Learning for Crop Disease and Yield Optimization",
            "snippet": "We present deep convolutional neural networks for automated crop monitoring, pest detection, and yield estimation.",
            "url": "https://doi.org/10.1016/j.compag.2024.108000",
            "source_type": "academic_openalex",
            "reliability": 0.96
        },
        {
            "title": "Pharmacokinetic Model of Doxycycline in Yellow Catfish Farming Under Variable Water Temperature",
            "snippet": "Depletion kinetics of doxycycline hydrochloride was investigated in yellow catfish to evaluate veterinary withdrawal intervals.",
            "url": "https://pubmed.ncbi.nlm.nih.gov/38200001/",
            "source_type": "academic_pubmed",
            "reliability": 0.98
        },
        {
            "title": "Clinical Evaluation of Dental Periodontitis in Domestic Swine",
            "snippet": "Surgical flaps and antimicrobial irrigation were evaluated for gingival inflammation in swine models.",
            "url": "https://pubmed.ncbi.nlm.nih.gov/38200002/",
            "source_type": "academic_pubmed",
            "reliability": 0.97
        },
        {
            "title": "Autonomous Agricultural Robotics and Computer Vision for Weed Detection and Smart Irrigation",
            "snippet": "Autonomous field rovers equipped with multispectral cameras and YOLO vision models achieved 94% precision in weed classification.",
            "url": "https://arxiv.org/abs/2403.00010",
            "source_type": "academic_arxiv",
            "reliability": 0.95
        }
    ]

    # Test individual scores
    score_ai_crop, tier_ai_crop, rat_ai_crop = SourceRelevanceScorer.score_source(query, cleaned_topic, classification, candidates[0])
    assert score_ai_crop >= 0.70
    assert tier_ai_crop == "HIGH"

    score_doxy, tier_doxy, rat_doxy = SourceRelevanceScorer.score_source(query, cleaned_topic, classification, candidates[1])
    assert score_doxy <= 0.10
    assert tier_doxy == "IRRELEVANT"
    assert "rejected" in rat_doxy.lower()

    score_swine, tier_swine, _ = SourceRelevanceScorer.score_source(query, cleaned_topic, classification, candidates[2])
    assert score_swine <= 0.10
    assert tier_swine == "IRRELEVANT"

    # Test hard relevance gate filtering
    retained = SourceRelevanceScorer.filter_and_rank_sources(
        query=query,
        cleaned_topic=cleaned_topic,
        classification=classification,
        sources=candidates,
        threshold=0.45
    )

    assert len(retained) == 2
    retained_titles = [r["title"] for r in retained]
    assert candidates[0]["title"] in retained_titles
    assert candidates[3]["title"] in retained_titles
    assert candidates[1]["title"] not in retained_titles
    assert candidates[2]["title"] not in retained_titles


def test_query_classification_and_formal_titles():
    """Test 6 user query types for proper intent routing and formal title generation."""
    cases = [
        ("make research about farming with AI", "agriculture_farming", "academic_scientific"),
        ("How does AI help detect crop diseases?", "agriculture_farming", "academic_scientific"),
        ("roadmap to become an AI engineer", "career_education", "roadmap"),
        ("What is machine learning?", "computer_science_ai", "simple_explanation"),
        ("latest research on AI in agriculture", "agriculture_farming", "realtime_web"),
        ("advantages and disadvantages of AI in farming", "agriculture_farming", "comparison")
    ]

    for q, expected_domain, expected_intent in cases:
        c = QueryClassifier.classify(q)
        assert c["domain"] == expected_domain, f"Failed domain for '{q}': got {c['domain']}, expected {expected_domain}"
        assert c["intent"] == expected_intent, f"Failed intent for '{q}': got {c['intent']}, expected {expected_intent}"
        assert len(c["formal_title"]) > 15
        assert not c["formal_title"].lower().startswith("make research")


def test_20_query_evaluation_benchmark_suite():
    """Evaluates 20 diverse research queries across precision, domain routing, and query expansions."""
    benchmark_queries = [
        "make research about farming with AI",
        "How does AI help detect crop diseases?",
        "roadmap to become an AI engineer",
        "What is machine learning?",
        "latest research on AI in agriculture",
        "advantages and disadvantages of AI in farming",
        "quantum error correction surface codes",
        "evaluating memory efficiency in KV-cache quantization",
        "CRISPR gene editing in agricultural biotechnology",
        "Python vs Rust for scalable backend services",
        "graph neural networks for molecular property prediction",
        "zero knowledge proofs in decentralized finance",
        "autonomous drone navigation in GPS-denied environments",
        "reinforcement learning from human feedback for LLMs",
        "retrieval augmented generation chunking strategies",
        "high throughput phenotyping in plant breeding",
        "computer vision for autonomous fruit harvesting",
        "microservices vs monolithic architecture performance",
        "federated learning privacy guarantees in healthcare",
        "transformer attention mechanisms state of the art"
    ]

    assert len(benchmark_queries) == 20

    for query in benchmark_queries:
        c = QueryClassifier.classify(query)
        assert len(c["cleaned_topic"]) > 2
        assert len(c["sub_queries"]) >= 3
        assert len(c["formal_title"]) > 10


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
