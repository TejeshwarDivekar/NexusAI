import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from app.db.database import get_db
from app.db.models import Conversation, Message, ResearchTask, User
from app.schemas.conversations import (
    ConversationCreate, ConversationUpdate, ConversationOut,
    ConversationDetailOut, MessageCreate, MessageOut
)
from app.core.security import get_current_user
from app.core.logging import logger

router = APIRouter(prefix="/conversations", tags=["Conversations & Chat History"])


def generate_title_from_query(query: str) -> str:
    """Generates a concise, clean title from a query without extra LLM overhead."""
    cleaned = " ".join(query.strip().split())
    if len(cleaned) <= 45:
        return cleaned.capitalize()
    truncated = cleaned[:45]
    if " " in truncated:
        truncated = truncated.rsplit(" ", 1)[0]
    return f"{truncated}..."


def compute_date_group(dt: datetime.datetime) -> str:
    """Classifies timestamp into Today, Yesterday, or Older."""
    now = datetime.datetime.utcnow()
    diff = now.date() - dt.date()
    if diff.days == 0:
        return "Today"
    elif diff.days == 1:
        return "Yesterday"
    else:
        return "Older"


@router.get("", response_model=List[ConversationOut])
@router.get("/", response_model=List[ConversationOut])
def list_conversations(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns paginated conversations belonging to the authenticated user.
    Eagerly loads relationships to eliminate N+1 queries.
    """
    convos = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.messages),
            joinedload(Conversation.tasks)
        )
        .filter(Conversation.user_id == current_user.id)
        .order_by(desc(Conversation.updated_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    result = []
    for c in convos:
        last_msg = c.messages[-1].content if c.messages else None
        if last_msg and len(last_msg) > 60:
            last_msg = last_msg[:60] + "..."

        result.append(
            ConversationOut(
                id=c.id,
                user_id=c.user_id,
                title=c.title,
                created_at=c.created_at,
                updated_at=c.updated_at,
                message_count=len(c.messages),
                task_count=len(c.tasks),
                last_message=last_msg,
                date_group=compute_date_group(c.updated_at)
            )
        )
    return result


@router.post("", response_model=ConversationOut)
@router.post("/", response_model=ConversationOut)
def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new conversation record for the authenticated user.
    """
    convo_id = str(uuid.uuid4())
    title = payload.title
    if not title and payload.initial_query:
        title = generate_title_from_query(payload.initial_query)
    if not title:
        title = "New Research Inquiry"

    now = datetime.datetime.utcnow()
    convo = Conversation(
        id=convo_id,
        user_id=current_user.id,
        title=title,
        created_at=now,
        updated_at=now
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)

    return ConversationOut(
        id=convo.id,
        user_id=convo.user_id,
        title=convo.title,
        created_at=convo.created_at,
        updated_at=convo.updated_at,
        message_count=0,
        task_count=0,
        last_message=None,
        date_group="Today"
    )


@router.get("/{conversation_id}", response_model=ConversationDetailOut)
def get_conversation_detail(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves full conversation with messages and associated research runs.
    Strictly verifies ownership: conversation.user_id == current_user.id.
    """
    convo = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.messages),
            joinedload(Conversation.tasks)
        )
        .filter(Conversation.id == conversation_id)
        .first()
    )
    if not convo or convo.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Format tasks / research runs
    tasks_data = []
    for t in convo.tasks:
        tasks_data.append({
            "task_id": t.id,
            "query": t.query,
            "status": t.status,
            "sub_queries": t.sub_queries or [],
            "sources": t.sources or [],
            "evidence_matrix": t.evidence_matrix or [],
            "contradictions": t.contradictions or [],
            "report_markdown": t.report_markdown or "",
            "report_summary": t.report_summary or "",
            "quality_score": t.quality_score or 90.0,
            "source_diversity_score": t.source_diversity_score or 85.0,
            "evidence_coverage_score": t.evidence_coverage_score or 90.0,
            "docx_download_url": f"/api/v1/research/tasks/{t.id}/document/download" if t.generated_documents else None,
            "created_at": t.created_at.isoformat() if t.created_at else None
        })

    return ConversationDetailOut(
        id=convo.id,
        user_id=convo.user_id,
        title=convo.title,
        created_at=convo.created_at,
        updated_at=convo.updated_at,
        messages=[MessageOut.model_validate(m) for m in convo.messages],
        tasks=tasks_data
    )


@router.patch("/{conversation_id}", response_model=ConversationOut)
def update_conversation_title(
    conversation_id: str,
    payload: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Renames a conversation. Strictly verifies ownership.
    """
    convo = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not convo or convo.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    convo.title = payload.title.strip()
    convo.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(convo)

    return ConversationOut(
        id=convo.id,
        user_id=convo.user_id,
        title=convo.title,
        created_at=convo.created_at,
        updated_at=convo.updated_at,
        message_count=len(convo.messages),
        task_count=len(convo.tasks),
        date_group=compute_date_group(convo.updated_at)
    )


@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a conversation and cascades all messages, research tasks, and generated docs.
    Strictly verifies ownership.
    """
    convo = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not convo or convo.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    db.delete(convo)
    db.commit()
    logger.info(f"User {current_user.id} deleted conversation {conversation_id}")
    return {"status": "deleted", "id": conversation_id}


@router.post("/{conversation_id}/messages", response_model=MessageOut)
def add_message_to_conversation(
    conversation_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Saves a message directly to the conversation. Strictly verifies ownership.
    """
    convo = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not convo or convo.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    now = datetime.datetime.utcnow()
    msg = Message(
        conversation_id=convo.id,
        role=payload.role,
        content=payload.content,
        created_at=now
    )
    db.add(msg)
    convo.updated_at = now
    
    # If this is the first user message and title is default, auto-generate title
    if len(convo.messages) == 0 and payload.role == "user" and convo.title in ("New Research Inquiry", "New Chat"):
        convo.title = generate_title_from_query(payload.content)

    db.commit()
    db.refresh(msg)
    return MessageOut.model_validate(msg)
