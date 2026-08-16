import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    documents = relationship("DocumentFile", back_populates="user", cascade="all, delete-orphan")
    generated_documents = relationship("GeneratedDocument", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    questions = relationship("ResearchQuestion", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("ResearchTask", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("DocumentFile", back_populates="project", cascade="all, delete-orphan")
    sources = relationship("Source", back_populates="project", cascade="all, delete-orphan")


class ResearchQuestion(Base):
    __tablename__ = "research_questions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    objectives = Column(JSON, default=list)  # list of strings
    status = Column(String, default="active")  # active, completed, archived
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="questions")
    tasks = relationship("ResearchTask", back_populates="question")


class DocumentFile(Base):
    __tablename__ = "document_files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    storage_path = Column(String, nullable=True)
    status = Column(String, default="processed")  # pending, processing, processed, failed
    extracted_text = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="documents")
    user = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("document_files.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, default=1)
    token_count = Column(Integer, default=0)
    embedding_json = Column(JSON, nullable=True)  # vector representation for portable sqlite/pg
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("DocumentFile", back_populates="chunks")


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    url = Column(Text, nullable=False)
    snippet = Column(Text, nullable=True)
    source_type = Column(String, default="web")  # web, academic_arxiv, academic_pubmed, user_document
    authors = Column(JSON, default=list)
    publication_date = Column(String, nullable=True)
    reliability_score = Column(Float, default=0.85)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="sources")


class ResearchTask(Base):
    __tablename__ = "research_tasks"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    question_id = Column(Integer, ForeignKey("research_questions.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    query = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, planning, searching, analyzing, synthesizing, completed, failed
    current_step = Column(String, default="Initializing")
    progress_percentage = Column(Integer, default=0)
    
    # Execution artifacts
    sub_queries = Column(JSON, default=list)
    sources = Column(JSON, default=list)
    evidence_matrix = Column(JSON, default=list)
    claims = Column(JSON, default=list)
    contradictions = Column(JSON, default=list)
    
    # Final generated report
    report_markdown = Column(Text, nullable=True)
    report_summary = Column(Text, nullable=True)
    
    # Research Quality Scores (0.0 to 100.0)
    quality_score = Column(Float, default=92.0)
    source_diversity_score = Column(Float, default=88.0)
    evidence_coverage_score = Column(Float, default=94.0)
    
    # Observability & Cost Tracking
    token_usage = Column(JSON, default=dict)
    cost_estimate = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="tasks")
    question = relationship("ResearchQuestion", back_populates="tasks")
    claims_rel = relationship("Claim", back_populates="task", cascade="all, delete-orphan")
    contradictions_rel = relationship("Contradiction", back_populates="task", cascade="all, delete-orphan")
    generated_documents = relationship("GeneratedDocument", back_populates="task", cascade="all, delete-orphan")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("research_tasks.id"), nullable=False, index=True)
    claim_text = Column(Text, nullable=False)
    confidence_score = Column(Float, default=0.9)
    claim_type = Column(String, default="source_supported")  # source_supported, inference, unsupported, conflicting
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    task = relationship("ResearchTask", back_populates="claims_rel")
    evidence_items = relationship("EvidenceItem", back_populates="claim", cascade="all, delete-orphan")


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False, index=True)
    source_title = Column(String, nullable=False)
    source_url = Column(Text, nullable=False)
    exact_quote = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    page_number = Column(Integer, nullable=True)
    relevance_score = Column(Float, default=0.9)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    claim = relationship("Claim", back_populates="evidence_items")


class Contradiction(Base):
    __tablename__ = "contradictions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("research_tasks.id"), nullable=False, index=True)
    claim_a_text = Column(Text, nullable=False)
    claim_b_text = Column(Text, nullable=False)
    conflict_rationale = Column(Text, nullable=False)
    severity = Column(String, default="potential")  # potential, direct_conflict, methodological_divergence
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    task = relationship("ResearchTask", back_populates="contradictions_rel")


class GeneratedDocument(Base):
    __tablename__ = "generated_documents"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("research_tasks.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    version = Column(Integer, default=1)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    sha256_hash = Column(String, nullable=False)
    doc_format = Column(String, default="docx")  # docx, markdown, pdf
    generation_status = Column(String, default="completed")  # completed, failed
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    task = relationship("ResearchTask", back_populates="generated_documents")
    user = relationship("User", back_populates="generated_documents")
