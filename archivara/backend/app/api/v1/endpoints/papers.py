from typing import List, Optional, Annotated
from datetime import datetime
import json

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.db.session import get_db
from app.models.paper import Paper, Author, Model, Tool
from app.models.user import User
from app.schemas.paper import PaperCreate, PaperResponse, PaperList, PaperUpdate
from app.services.storage import storage_service, S3StorageService
from app.services.embeddings import embedding_service
from app.services.vector_db import vector_db_service
from app.core.config import settings
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=PaperList)
async def list_papers(
    page: int = 1,
    size: int = 20,
    status: Optional[str] = None,
    domain: Optional[List[str]] = None,
    db: AsyncSession = Depends(get_db)
):
    """List papers with pagination and filtering"""
    # Build query with eager loading
    query = select(Paper).options(
        selectinload(Paper.authors),
        selectinload(Paper.models),
        selectinload(Paper.tools)
    )
    
    if status:
        query = query.where(Paper.status == status)
    
    if domain:
        # Filter by any matching domain
        for d in domain:
            query = query.where(Paper.domain.contains([d]))
    
    # Get total count
    count_query = select(func.count()).select_from(Paper)
    if status:
        count_query = count_query.where(Paper.status == status)
    
    result = await db.execute(count_query)
    total = result.scalar()
    
    # Apply pagination
    offset = (page - 1) * size
    query = query.offset(offset).limit(size).order_by(Paper.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    papers = result.scalars().all()
    
    return PaperList(
        items=[PaperResponse.from_paper(paper) for paper in papers],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size
    )


@router.get("/my-submissions", response_model=List[PaperResponse])
async def get_my_submissions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Get current user's paper submissions."""
    query = select(Paper).where(Paper.submitter_id == current_user.id).options(
        selectinload(Paper.authors),
        selectinload(Paper.models),
        selectinload(Paper.tools)
    )
    
    result = await db.execute(query)
    papers = result.scalars().all()
    
    # Convert to PaperResponse with safe defaults
    return [PaperResponse.from_paper(paper) for paper in papers]


@router.post("/submit", response_model=PaperResponse)
async def submit_paper(
    current_user: Annotated[User, Depends(get_current_user)],
    title: str = Form(...),
    abstract: str = Form(...),
    authors: str = Form(...),  # JSON string
    categories: str = Form(...),  # JSON string
    ai_tools: str = Form(...),  # JSON string
    generation_method: str = Form(...),
    code_url: Optional[str] = Form(None),
    data_url: Optional[str] = Form(None),
    pdf_file: UploadFile = File(...),
    tex_file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    """Submit a new paper."""
    try:
        # Parse JSON fields
        authors_list = json.loads(authors)
        categories_list = json.loads(categories)
        ai_tools_list = json.loads(ai_tools)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in form fields")
    
    # Upload files to S3
    storage = S3StorageService()
    
    # Upload PDF
    pdf_key = f"papers/{current_user.id}/{datetime.utcnow().isoformat()}-{pdf_file.filename}"
    pdf_url, pdf_hash = await storage.upload_file(pdf_file.file, pdf_key, pdf_file.content_type)
    
    # Upload TeX if provided
    tex_url = None
    tex_hash = None
    if tex_file:
        tex_key = f"papers/{current_user.id}/{datetime.utcnow().isoformat()}-{tex_file.filename}"
        tex_url, tex_hash = await storage.upload_file(tex_file.file, tex_key, tex_file.content_type)
    
    # Create paper
    paper = Paper(
        title=title,
        abstract=abstract,
        submitter_id=current_user.id,
        categories=categories_list,
        pdf_url=pdf_url,
        pdf_hash=pdf_hash,
        tex_url=tex_url,
        tex_hash=tex_hash,
        code_url=code_url,
        data_url=data_url,
        generation_method=generation_method,
        status="submitted",
        meta={
            "ai_tools": ai_tools_list,
        }
    )
    
    # Create authors
    for author_data in authors_list:
        author = Author(
            name=author_data["name"],
            affiliation=author_data.get("affiliation"),
            is_ai_model=author_data.get("isAI", False),
        )
        paper.authors.append(author)
    
    db.add(paper)
    await db.commit()
    await db.refresh(paper)
    
    # Eagerly load relationships to prevent async errors during serialization
    result = await db.execute(
        select(Paper).where(Paper.id == paper.id).options(
            selectinload(Paper.authors),
            selectinload(Paper.models),
            selectinload(Paper.tools)
        )
    )
    loaded_paper = result.scalar_one()

    return loaded_paper


@router.get("/{paper_id}", response_model=PaperResponse)
async def get_paper(
    paper_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific paper by ID"""
    query = select(Paper).where(Paper.id == paper_id).options(
        selectinload(Paper.authors),
        selectinload(Paper.models),
        selectinload(Paper.tools)
    )
    result = await db.execute(query)
    paper = result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    return paper


@router.post("/", response_model=PaperResponse)
async def create_paper(
    pdf_file: UploadFile = File(...),
    paper_data: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new paper submission
    
    The paper_data should be a JSON string containing PaperCreate schema
    """
    # Validate file type
    if not pdf_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Validate file size
    if pdf_file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE} bytes"
        )
    
    # Parse paper data
    try:
        paper_create = PaperCreate(**json.loads(paper_data))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in paper_data")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid paper data: {str(e)}")
    
    # Upload PDF to S3
    pdf_url, pdf_hash = await storage_service.upload_file(
        pdf_file.file,
        ".pdf",
        folder="papers"
    )
    
    # Create paper record
    paper = Paper(
        title=paper_create.title,
        abstract=paper_create.abstract,
        doi=paper_create.doi,
        arxiv_id=paper_create.arxiv_id,
        published_at=paper_create.published_at,
        pdf_url=pdf_url,
        pdf_hash=pdf_hash,
        version=paper_create.version,
        language=paper_create.language,
        license=paper_create.license,
        generation_method=paper_create.generation_method,
        generation_metadata=paper_create.generation_metadata,
        domain=paper_create.domain,
        methodology=paper_create.methodology,
        datasets_used=paper_create.datasets_used,
        status="pending",
        submitter_id=UUID("00000000-0000-0000-0000-000000000000")  # TODO: Get from auth
    )
    
    db.add(paper)
    await db.flush()  # Get the paper ID
    
    # Add authors
    for i, author_data in enumerate(paper_create.authors):
        # Check if author exists by ORCID
        author = None
        if author_data.orcid:
            query = select(Author).where(Author.orcid == author_data.orcid)
            result = await db.execute(query)
            author = result.scalar_one_or_none()
        
        if not author:
            author = Author(**author_data.dict())
            db.add(author)
        
        # Link author to paper
        paper.authors.append(author)
    
    # Add models
    for model_data in paper_create.models:
        model = Model(paper_id=paper.id, **model_data.dict())
        db.add(model)
    
    # Add tools
    for tool_data in paper_create.tools:
        tool = Tool(paper_id=paper.id, **tool_data.dict())
        db.add(tool)
    
    # Generate embeddings (async task in production)
    embeddings = embedding_service.embed_paper_content(
        title=paper.title,
        abstract=paper.abstract
    )
    
    # Index in vector database
    await vector_db_service.index_paper(
        paper_id=paper.id,
        title_embedding=embeddings["title"],
        abstract_embedding=embeddings["abstract"],
        metadata={
            "title": paper.title,
            "domain": paper.domain,
            "published_at": paper.published_at.isoformat()
        }
    )
    
    await db.commit()
    await db.refresh(paper)

    # Re-fetch the paper with relationships eagerly loaded to prevent lazy-loading errors
    # during serialization by Pydantic/FastAPI.
    result = await db.execute(
        select(Paper)
        .where(Paper.id == paper.id)
        .options(
            selectinload(Paper.authors),
            selectinload(Paper.models),
            selectinload(Paper.tools)
        )
    )
    loaded_paper = result.scalar_one()
    
    return loaded_paper


@router.put("/{paper_id}", response_model=PaperResponse)
async def update_paper(
    paper_id: UUID,
    paper_update: PaperUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update paper metadata"""
    query = select(Paper).where(Paper.id == paper_id)
    result = await db.execute(query)
    paper = result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Update fields
    update_data = paper_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(paper, field, value)
    
    await db.commit()
    await db.refresh(paper)
    
    # Convert to response
    paper_dict = paper.__dict__
    paper_dict["citation_count"] = len(paper.citations) if paper.citations else 0
    paper_dict["cited_by_count"] = len(paper.cited_by) if paper.cited_by else 0
    
    return PaperResponse(**paper_dict)


@router.delete("/{paper_id}")
async def delete_paper(
    paper_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a paper (admin only)"""
    query = select(Paper).where(Paper.id == paper_id)
    result = await db.execute(query)
    paper = result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Delete from vector DB
    await vector_db_service.delete_paper(paper_id)
    
    # Delete from database (cascade will handle related records)
    await db.delete(paper)
    await db.commit()
    
    return {"message": "Paper deleted successfully"} 