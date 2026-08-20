from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
import pypdf
import io

from app.config import settings
from app.db.database import get_db
from app.db.models import DocumentFile, DocumentChunk, User, Project
from app.schemas.documents import DocumentOut, DocumentChunkOut, DocumentUploadResponse
from app.core.security import get_current_user_optional, get_current_user
from app.core.exceptions import NotFoundException, ForbiddenException, ValidationException
from app.services.chunking_service import ChunkingService
from app.services.providers.embeddings import DenseEmbeddingProvider

router = APIRouter(prefix="/documents", tags=["Documents & Ingestion"])
chunking_service = ChunkingService()
embedding_provider = DenseEmbeddingProvider()


def get_or_create_default_user(db: Session) -> User:
    user = db.query(User).first()
    if not user:
        from app.core.security import get_password_hash
        user = User(
            email="researcher@nexusai.com",
            username="Principal Researcher",
            hashed_password=get_password_hash("ResearchPass2026!")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("", response_model=List[DocumentOut])
@router.get("/", response_model=List[DocumentOut])
def list_documents(
    project_id: Optional[int] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = current_user or get_or_create_default_user(db)
    query = db.query(DocumentFile).filter(DocumentFile.user_id == user.id)
    if project_id:
        # Validate user owns project
        proj = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
        if not proj:
            raise ForbiddenException(detail="You do not have access to this project's documents.")
        query = query.filter(DocumentFile.project_id == project_id)
    
    docs = query.order_by(DocumentFile.created_at.desc()).all()
    
    result = []
    for d in docs:
        result.append(DocumentOut(
            id=d.id,
            project_id=d.project_id,
            filename=d.filename,
            file_type=d.file_type,
            file_size=d.file_size,
            status=d.status,
            created_at=d.created_at,
            chunks_count=len(d.chunks)
        ))
    return result


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    project_id: Optional[int] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = current_user or get_or_create_default_user(db)

    # Validate project ownership if attached
    if project_id:
        proj = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
        if not proj:
            raise ForbiddenException(detail="Cannot attach document to a project you do not own.")

    filename = file.filename or "uploaded_document"
    content_bytes = await file.read()
    file_size = len(content_bytes)

    # Size check (25MB default)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise ValidationException(f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.")

    extracted_text = ""
    page_count = 1

    # Magic byte and format check
    is_pdf = content_bytes.startswith(b"%PDF-") or filename.lower().endswith(".pdf")
    if is_pdf:
        try:
            pdf_reader = pypdf.PdfReader(io.BytesIO(content_bytes))
            page_count = len(pdf_reader.pages)
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n\n"
        except Exception as e:
            extracted_text = f"PDF text extraction note: {str(e)}"
    else:
        try:
            extracted_text = content_bytes.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = f"Raw document file: {filename}"

    if not extracted_text.strip():
        extracted_text = f"Document contents for {filename} (size: {file_size} bytes)."

    doc = DocumentFile(
        project_id=project_id,
        user_id=user.id,
        filename=filename,
        file_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        status="processed",
        extracted_text=extracted_text[:100000],  # 100k char safeguard
        metadata_json={"page_count": page_count}
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Generate semantic chunks and embeddings
    raw_chunks = chunking_service.chunk_text(doc.extracted_text)
    for c in raw_chunks:
        emb_vector = await embedding_provider.embed_text(c["content"])
        chunk_obj = DocumentChunk(
            document_id=doc.id,
            chunk_index=c["chunk_index"],
            content=c["content"],
            page_number=c["page_number"],
            token_count=c["token_count"],
            embedding_json=emb_vector
        )
        db.add(chunk_obj)
    
    db.commit()

    return DocumentUploadResponse(
        id=doc.id,
        filename=doc.filename,
        file_size=doc.file_size,
        char_count=len(doc.extracted_text),
        chunks_created=len(raw_chunks),
        message="Document uploaded, text extracted, and indexed with semantic chunks."
    )


@router.get("/{document_id}/chunks", response_model=List[DocumentChunkOut])
def get_document_chunks(
    document_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = current_user or get_or_create_default_user(db)
    doc = db.query(DocumentFile).filter(DocumentFile.id == document_id).first()
    if not doc:
        raise NotFoundException(resource="Document", resource_id=document_id)
    if doc.user_id != user.id:
        raise ForbiddenException()
    return doc.chunks


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = current_user or get_or_create_default_user(db)
    doc = db.query(DocumentFile).filter(DocumentFile.id == document_id).first()
    if not doc:
        raise NotFoundException(resource="Document", resource_id=document_id)
    if doc.user_id != user.id:
        raise ForbiddenException()
    db.delete(doc)
    db.commit()
    return {"message": "Document and associated chunks deleted successfully", "id": document_id}
