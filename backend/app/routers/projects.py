from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Project, User, ResearchQuestion
from app.schemas.projects import (
    ProjectCreate, ProjectUpdate, ProjectOut, ResearchQuestionCreate, ResearchQuestionOut
)
from app.core.security import get_current_user_optional, get_current_user
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter(prefix="/projects", tags=["Research Projects"])

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

@router.get("/", response_model=List[ProjectOut])
def list_projects(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = current_user or get_or_create_default_user(db)
    projects = db.query(Project).filter(Project.user_id == user.id).order_by(Project.updated_at.desc()).all()
    return projects

@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = current_user or get_or_create_default_user(db)
    project = Project(
        title=project_in.title,
        description=project_in.description,
        user_id=user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Attach initial research questions if provided
    if project_in.questions:
        for q in project_in.questions:
            rq = ResearchQuestion(
                project_id=project.id,
                question_text=q.question_text,
                objectives=q.objectives
            )
            db.add(rq)
        db.commit()
        db.refresh(project)

    return project

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = current_user or get_or_create_default_user(db)
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException(resource="Project", resource_id=project_id)
    if project.user_id != user.id:
        raise ForbiddenException()
    return project

@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = current_user or get_or_create_default_user(db)
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException(resource="Project", resource_id=project_id)
    if project.user_id != user.id:
        raise ForbiddenException()
    
    if project_in.title is not None:
        project.title = project_in.title
    if project_in.description is not None:
        project.description = project_in.description
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = current_user or get_or_create_default_user(db)
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException(resource="Project", resource_id=project_id)
    if project.user_id != user.id:
        raise ForbiddenException()
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully", "id": project_id}

@router.post("/{project_id}/questions", response_model=ResearchQuestionOut, status_code=status.HTTP_201_CREATED)
def add_research_question(
    project_id: int,
    question_in: ResearchQuestionCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = current_user or get_or_create_default_user(db)
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException(resource="Project", resource_id=project_id)
    if project.user_id != user.id:
        raise ForbiddenException()
    
    rq = ResearchQuestion(
        project_id=project.id,
        question_text=question_in.question_text,
        objectives=question_in.objectives
    )
    db.add(rq)
    db.commit()
    db.refresh(rq)
    return rq
