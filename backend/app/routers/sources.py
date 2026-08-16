from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Source, Project
from app.schemas.sources import SourceOut, SearchRequest
from app.services.providers.search import MultiSearchAggregator
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/sources", tags=["Sources & External Search"])
search_aggregator = MultiSearchAggregator()

@router.get("/", response_model=List[SourceOut])
def list_sources(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Source)
    if project_id:
        query = query.filter(Source.project_id == project_id)
    return query.order_by(Source.created_at.desc()).all()

@router.post("/search")
async def execute_search(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    results = await search_aggregator.search_all(
        queries=[request.query],
        include_academic=request.include_academic,
        max_per_query=request.max_results
    )

    # If linked to a project, persist top sources
    if request.project_id:
        for r in results[:5]:
            src = Source(
                project_id=request.project_id,
                title=r.get("title", "Search Result"),
                url=r.get("url", "#"),
                snippet=r.get("snippet", ""),
                source_type=r.get("source_type", "web"),
                authors=r.get("authors", []),
                publication_date=r.get("publication_date"),
                reliability_score=r.get("reliability", 0.85)
            )
            db.add(src)
        db.commit()

    return {
        "query": request.query,
        "results_count": len(results),
        "sources": results
    }
