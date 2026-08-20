import pytest
import asyncio
from datetime import datetime

from app.services.query_classifier import QueryClassifier
from app.services.data_analysis_service import DataAnalysisService
from app.services.providers.search import MultiSearchAggregator, WikipediaSearchProvider, ArxivSearchProvider, DuckDuckGoSearchProvider
from app.services.document_generation import IEEEDocumentGenerator, IEEEDocumentValidator
from app.services.research_engine import ResearchEngine


# TEST 1: Query Classification across Question Archetypes
def test_query_classification_general_and_realtime():
    res1 = QueryClassifier.classify("Who is Alan Turing?")
    assert res1["intent"] == "factual_encyclopedic"
    assert res1["is_current_required"] is False
    assert len(res1["sub_queries"]) >= 2
    assert "retrieval_timestamp" in res1

    res2 = QueryClassifier.classify("What is the latest NVIDIA stock price and market cap?")
    assert res2["intent"] == "realtime_web"
    assert res2["is_current_required"] is True

    res3 = QueryClassifier.classify("Compare memory efficiency in Transformer KV-cache quantization")
    assert res3["intent"] in ["academic_scientific", "comparison"]

    res4 = QueryClassifier.classify("Calculate mean, standard deviation and growth rate for 15, 25, 40, 60, 95")
    assert res4["intent"] == "numerical_data"


# TEST 2: Numerical Data Analysis (Exact math, zero hallucinations)
def test_numerical_data_analysis_engine():
    # Test valid numeric series
    data = [10.0, 20.0, 30.0, 40.0, 50.0]
    stats = DataAnalysisService.analyze_numeric_series(data, label="Throughput", unit="tokens/sec")
    
    assert stats["status"] == "success"
    assert stats["count"] == 5
    assert stats["sum"] == 150.0
    assert stats["mean"] == 30.0
    assert stats["median"] == 30.0
    assert stats["min"] == 10.0
    assert stats["max"] == 50.0
    assert stats["std_dev"] == pytest.approx(15.811, rel=1e-2)
    assert stats["percentage_change"] == 400.0  # (50 - 10) / 10 * 100

    # Test growth rate calculation
    growth = DataAnalysisService.calculate_growth_rate(start_value=100.0, end_value=250.0, periods=3)
    assert growth["status"] == "success"
    assert growth["percentage_growth"] == 150.0
    assert growth["cagr"] == pytest.approx(35.72, rel=1e-2)

    # Test insufficient data handling
    empty_res = DataAnalysisService.analyze_numeric_series([])
    assert empty_res["status"] == "insufficient_data"
    assert "Insufficient data" in empty_res["message"]


# TEST 3: CSV and Table Parsing
def test_csv_table_analysis():
    csv_text = """Year,Revenue_Billions,Growth_Pct
2022,10.5,12.0
2023,14.2,35.2
2024,22.8,60.5
2025,38.4,68.4"""
    
    res = DataAnalysisService.parse_csv_or_table(csv_text)
    assert res is not None
    assert "Revenue_Billions" in res["statistics"]
    assert res["statistics"]["Revenue_Billions"]["count"] == 4
    assert res["statistics"]["Revenue_Billions"]["min"] == 10.5
    assert res["statistics"]["Revenue_Billions"]["max"] == 38.4


# TEST 4: Real Search Providers Live Verification
@pytest.mark.asyncio
async def test_real_search_providers():
    aggregator = MultiSearchAggregator()
    
    # 1. Wikipedia Search (General Knowledge / Encyclopedic)
    wiki_provider = WikipediaSearchProvider()
    wiki_results = await wiki_provider.search("Alan Turing", max_results=2)
    assert isinstance(wiki_results, list)
    if wiki_results:
        assert "turing" in wiki_results[0]["title"].lower() or "turing" in wiki_results[0]["snippet"].lower()
        assert "wikipedia" in wiki_results[0]["url"].lower()
        assert "retrieved_at" in wiki_results[0]

    # 2. ArXiv Search (Academic / CS Literature)
    arxiv_provider = ArxivSearchProvider()
    arxiv_results = await arxiv_provider.search("transformer attention kv cache", max_results=2)
    assert isinstance(arxiv_results, list)
    if arxiv_results:
        assert "arxiv.org" in arxiv_results[0]["url"]
        assert len(arxiv_results[0]["snippet"]) > 20

    # 3. Deduplication & Ranking
    mock_sources = [
        {"title": "Quantum Computing", "url": "https://doi.org/10.1000/1", "reliability": 0.95},
        {"title": "Quantum Computing Duplicate", "url": "https://doi.org/10.1000/1", "reliability": 0.95},
        {"title": "Other Paper", "url": "https://doi.org/10.1000/2", "reliability": 0.90}
    ]
    ranked = aggregator.deduplicate_and_rank(mock_sources)
    assert len(ranked) == 2


# TEST 5: Word Document Generation & Strict Quality Validation
def test_ieee_document_generator_and_validator(tmp_path):
    sources = [
        {
            "title": "Attention Is All You Need",
            "url": "https://arxiv.org/abs/1706.03762",
            "authors": ["Vaswani et al."],
            "publication_date": "2017",
            "source_type": "academic_arxiv"
        },
        {
            "title": "FlashAttention: Fast and Memory-Efficient Exact Attention",
            "url": "https://arxiv.org/abs/2205.14135",
            "authors": ["Dao et al."],
            "publication_date": "2022",
            "source_type": "academic_arxiv"
        }
    ]

    evidence_matrix = [
        {
            "citation_id": "[1]",
            "source_title": "Attention Is All You Need",
            "source_url": "https://arxiv.org/abs/1706.03762",
            "fact_snippet": "The Transformer allows for significantly more parallelization.",
            "confidence": "High (95%+)"
        },
        {
            "citation_id": "[2]",
            "source_title": "FlashAttention",
            "source_url": "https://arxiv.org/abs/2205.14135",
            "fact_snippet": "FlashAttention achieves 2-4x speedup compared to standard attention.",
            "confidence": "High (95%+)"
        }
    ]

    claims = [
        {
            "claim_text": "The Transformer allows for significantly more parallelization",
            "citation": "[1]",
            "source": "Attention Is All You Need",
            "url": "https://arxiv.org/abs/1706.03762",
            "confidence_score": 0.95
        }
    ]

    contradictions = []

    doc_meta = IEEEDocumentGenerator.generate_docx(
        task_id="test-task-12345",
        query="Transformer Attention Mechanisms",
        report_markdown="# Test Report",
        sources=sources,
        evidence_matrix=evidence_matrix,
        claims=claims,
        contradictions=contradictions,
        output_dir=str(tmp_path)
    )

    assert doc_meta["status"] == "success"
    assert doc_meta["file_size"] > 1024
    assert doc_meta["reference_count"] == 2

    # Validate with IEEEDocumentValidator
    val_report = IEEEDocumentValidator.validate_docx(
        file_path=doc_meta["file_path"],
        expected_sources_count=len(sources)
    )

    assert val_report["is_valid"] is True
    assert val_report["references_count"] == 2
    assert len(val_report["errors"]) == 0
    assert "I. INTRODUCTION" in val_report["sections_found"]
    assert "V. KEY FINDINGS" in val_report["sections_found"]
