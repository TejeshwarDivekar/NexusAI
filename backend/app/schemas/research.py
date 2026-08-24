from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import datetime


class GeneratedDocumentOut(BaseModel):
    id: int
    task_id: str
    version: int
    file_name: str
    file_size: int
    sha256_hash: str
    doc_format: str
    generation_status: str
    download_url: str
    created_at: datetime.datetime


class EvidenceItemOut(BaseModel):
    id: Optional[int] = None
    citation_id: Optional[str] = None
    source_title: str
    source_url: str
    exact_quote: str
    context: Optional[str] = None
    page_number: Optional[int] = None
    confidence: Optional[str] = "High (90%+)"
    relevance_score: Optional[float] = 0.9


class ClaimOut(BaseModel):
    id: Optional[int] = None
    claim_text: str
    confidence_score: float = 0.9
    claim_type: str = "source_supported"
    evidence: List[EvidenceItemOut] = []


class ContradictionOut(BaseModel):
    id: Optional[int] = None
    claim_a_text: str
    claim_b_text: str
    conflict_rationale: str
    severity: str = "potential"


class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=3)
    conversation_id: Optional[str] = None
    project_id: Optional[int] = None
    question_id: Optional[int] = None
    document_ids: Optional[List[int]] = None
    include_academic: bool = True
    depth: str = "deep"  # fast, standard, deep


class ResearchTaskStatus(BaseModel):
    task_id: str
    query: str
    status: str
    current_step: str
    progress_percentage: int
    sub_queries: List[str] = []
    sources_count: int = 0
    evidence_count: int = 0
    contradictions_count: int = 0
    error: Optional[str] = None


class ResearchResult(BaseModel):
    task_id: str
    conversation_id: Optional[str] = None
    query: str
    status: str
    project_id: Optional[int] = None
    report_markdown: Optional[str] = None
    report_summary: Optional[str] = None
    sub_queries: List[str] = []
    sources: List[Dict[str, Any]] = []
    evidence_matrix: List[Dict[str, Any]] = []
    claims: List[Dict[str, Any]] = []
    contradictions: List[Dict[str, Any]] = []
    quality_score: Optional[float] = 92.0
    source_diversity_score: Optional[float] = 88.0
    evidence_coverage_score: Optional[float] = 94.0
    docx_download_url: Optional[str] = None
    pdf_download_url: Optional[str] = None
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None


class ExplainEvidenceRequest(BaseModel):
    query: str
    claim: str
    fact_snippet: str
    source_title: Optional[str] = None
    source_url: Optional[str] = None
    source_authors: Optional[str] = None
    source_year: Optional[str] = None
    source_publisher: Optional[str] = None
    citation_id: Optional[str] = None


class ExplainEvidenceResponse(BaseModel):
    explanation: str
    claim: Optional[str] = None
    citation_id: Optional[str] = None
    main_takeaway: Optional[str] = None
    why_it_matters: Optional[str] = None
    connection_to_research: Optional[str] = None
    limitations: Optional[str] = None

