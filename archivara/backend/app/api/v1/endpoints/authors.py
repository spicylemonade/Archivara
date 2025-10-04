from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional
from collections import defaultdict

from app.db.session import get_db
from app.models.paper import Author, Paper, paper_authors
from app.schemas.author import AuthorResponse, AuthorDetailResponse

router = APIRouter()

@router.get("/{author_id}", response_model=AuthorDetailResponse)
async def get_author(
    author_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed author information including papers, stats, and collaborators"""

    # Get author
    query = select(Author).where(Author.id == author_id)
    result = await db.execute(query)
    author = result.scalar_one_or_none()

    if not author:
        raise HTTPException(status_code=404, detail="Author not found")

    # Get author's papers with all relationships
    papers_query = (
        select(Paper)
        .join(paper_authors)
        .where(paper_authors.c.author_id == author_id)
        .options(
            selectinload(Paper.authors),
            selectinload(Paper.models),
            selectinload(Paper.tools)
        )
        .order_by(Paper.published_at.desc())
    )
    papers_result = await db.execute(papers_query)
    papers = papers_result.scalars().all()

    # Calculate statistics
    total_papers = len(papers)
    total_citations = 0  # TODO: Add citation tracking

    # Calculate h-index (simplified - would need citation data for real calculation)
    h_index = min(total_papers, 10)  # Placeholder

    # Extract research areas from paper categories
    research_areas = set()
    for paper in papers:
        if paper.categories:
            research_areas.update(paper.categories[:2])  # Take first 2 categories per paper

    # Find collaborators
    collaborator_counts = defaultdict(int)
    collaborator_info = {}

    for paper in papers:
        for coauthor in paper.authors:
            if coauthor.id != author_id:
                collaborator_counts[coauthor.id] += 1
                if coauthor.id not in collaborator_info:
                    collaborator_info[coauthor.id] = {
                        "id": coauthor.id,
                        "name": coauthor.name,
                        "papers": 0
                    }
                collaborator_info[coauthor.id]["papers"] = collaborator_counts[coauthor.id]

    # Sort collaborators by paper count
    top_collaborators = sorted(
        collaborator_info.values(),
        key=lambda x: x["papers"],
        reverse=True
    )[:10]

    # Calculate stats by year
    stats_by_year = defaultdict(lambda: {"year": 0, "papers": 0, "citations": 0})
    for paper in papers:
        year = paper.published_at.year
        stats_by_year[year]["year"] = year
        stats_by_year[year]["papers"] += 1
        # TODO: Add citation data

    stats_list = sorted(stats_by_year.values(), key=lambda x: x["year"], reverse=True)

    # Prepare recent papers (top 10)
    from app.schemas.paper import PaperResponse
    recent_papers = [PaperResponse.from_paper(p) for p in papers[:10]]

    return AuthorDetailResponse(
        id=author.id,
        name=author.name,
        email=author.email,
        affiliation=author.affiliation,
        orcid=author.orcid,
        is_ai_model=author.is_ai_model,
        h_index=h_index,
        total_citations=total_citations,
        total_papers=total_papers,
        research_areas=list(research_areas)[:10],
        recent_papers=recent_papers,
        collaborators=top_collaborators,
        stats_by_year=stats_list[:5]
    )

@router.get("/", response_model=list[AuthorResponse])
async def search_authors(
    query: Optional[str] = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Search for authors by name"""

    stmt = select(Author)

    if query:
        stmt = stmt.where(Author.name.ilike(f"%{query}%"))

    stmt = stmt.limit(limit)

    result = await db.execute(stmt)
    authors = result.scalars().all()

    return [AuthorResponse.from_author(a) for a in authors]
