from typing import List, Optional, Annotated
from datetime import datetime
import json
import io
import base64

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.db.session import get_db
from app.models.paper import Paper, Author, Model, Tool, SubmissionAttempt, BaselineStatus, paper_authors
from app.models.user import User
from app.lib.verification import isVerifiedEmailDomain
from app.schemas.paper import PaperCreate, PaperResponse, PaperList, PaperUpdate
from app.services.storage import storage_service
from app.services.embeddings import embedding_service
from app.services.moderation import ModerationService
# from app.services.vector_db import vector_db_service  # TODO: Reimplement vector DB service
from app.core.config import settings
from app.api.v1.endpoints.auth import get_current_user
from fastapi.responses import StreamingResponse
from urllib.parse import urlparse

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
    # Check submission cooldown
    is_verified = isVerifiedEmailDomain(current_user.email)

    # Get recent rejected submissions
    from datetime import timedelta
    six_hours_ago = datetime.utcnow() - timedelta(hours=6)
    recent_rejections = await db.execute(
        select(SubmissionAttempt)
        .where(SubmissionAttempt.user_id == current_user.id)
        .where(SubmissionAttempt.status == 'rejected')
        .where(SubmissionAttempt.created_at >= six_hours_ago)
        .order_by(SubmissionAttempt.created_at.desc())
    )
    recent_rejections_list = recent_rejections.scalars().all()

    # Check cooldown rules
    if is_verified:
        # Verified users get 4 tries
        if len(recent_rejections_list) >= 4:
            last_rejection = recent_rejections_list[0]
            time_remaining = (last_rejection.created_at + timedelta(hours=6)) - datetime.utcnow()
            minutes_remaining = int(time_remaining.total_seconds() / 60)
            raise HTTPException(
                status_code=429,
                detail=f"You have exceeded 4 submission attempts. Please wait {minutes_remaining} minutes before trying again. Last rejection reason: {last_rejection.rejection_reason}"
            )
    else:
        # Unverified users get 1 try
        if len(recent_rejections_list) >= 1:
            last_rejection = recent_rejections_list[0]
            time_remaining = (last_rejection.created_at + timedelta(hours=6)) - datetime.utcnow()
            minutes_remaining = int(time_remaining.total_seconds() / 60)
            raise HTTPException(
                status_code=429,
                detail=f"Your submission was rejected. Please wait {minutes_remaining} minutes before trying again. Rejection reason: {last_rejection.rejection_reason}"
            )

    try:
        # Parse JSON fields
        authors_list = json.loads(authors)
        categories_list = json.loads(categories)
        ai_tools_list = json.loads(ai_tools)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in form fields")

    # Read PDF and encode to base64 for OpenRouter
    pdf_content = await pdf_file.read()
    pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')

    # Reset file pointer for upload
    pdf_file.file = io.BytesIO(pdf_content)

    # Upload files to storage (Supabase)
    # Upload PDF
    pdf_url, pdf_hash = await storage_service.upload_file(
        pdf_file.file,
        ".pdf",
        folder=f"papers/{current_user.id}"
    )

    # Upload TeX if provided
    tex_url = None
    tex_hash = None
    if tex_file:
        tex_url, tex_hash = await storage_service.upload_file(
            tex_file.file,
            ".tex",
            folder=f"papers/{current_user.id}"
        )

    # Create paper (temporary object for moderation)
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
        meta={
            "ai_tools": ai_tools_list,
            "pdf_base64": pdf_base64,  # Store base64 PDF for OpenRouter
        }
    )

    # Run moderation checks with PDF
    moderation = ModerationService(db)
    baseline_result = await moderation.run_baseline_checks(paper)
    quality_score, quality_analysis = await moderation.calculate_quality_score(paper, pdf_base64=pdf_base64)
    red_flags = await moderation.detect_red_flags(paper, pdf_base64=pdf_base64)
    visibility_tier = await moderation.assign_visibility_tier(paper)

    # Update paper with moderation results
    paper.baseline_status = baseline_result['status']
    paper.baseline_checks = baseline_result['checks']
    paper.quality_score = quality_score
    paper.red_flags = red_flags
    paper.visibility_tier = visibility_tier
    paper.needs_review = baseline_result['status'] == 'warn' or len(red_flags) > 0

    # Check if paper should be rejected
    if baseline_result['status'] == 'reject' or baseline_result['status'] == BaselineStatus.REJECT.value:
        # Create rejection record
        rejection_reasons = baseline_result.get('issues', [])
        rejection_text = '; '.join(rejection_reasons) if rejection_reasons else 'Paper did not meet quality standards'

        submission_attempt = SubmissionAttempt(
            user_id=current_user.id,
            paper_id=None,  # Paper wasn't accepted
            status='rejected',
            rejection_reason=rejection_text
        )
        db.add(submission_attempt)
        await db.commit()

        raise HTTPException(
            status_code=422,
            detail={
                'message': 'Paper submission rejected',
                'reasons': rejection_reasons,
                'quality_score': quality_score
            }
        )

    # First save the paper without authors
    db.add(paper)
    await db.flush()  # Get paper ID without committing

    # Create authors with explicit ordering
    for idx, author_data in enumerate(authors_list):
        # Check if author already exists by email
        existing_author = None
        if author_data.get("email"):
            result = await db.execute(
                select(Author).where(Author.email == author_data["email"])
            )
            existing_author = result.scalar_one_or_none()

        if existing_author:
            author_id = existing_author.id
        else:
            author = Author(
                name=author_data["name"],
                email=author_data.get("email"),
                affiliation=author_data.get("affiliation"),
                is_ai_model=author_data.get("isAI", False),
            )
            db.add(author)
            await db.flush()
            author_id = author.id

        # Insert into paper_authors with order
        await db.execute(
            paper_authors.insert().values(
                paper_id=paper.id,
                author_id=author_id,
                order=idx
            )
        )

    await db.commit()
    await db.refresh(paper)

    # Record successful submission
    submission_attempt = SubmissionAttempt(
        user_id=current_user.id,
        paper_id=paper.id,
        status='accepted',
        rejection_reason=None
    )
    db.add(submission_attempt)
    await db.commit()

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
    paper_id: str,
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

    return PaperResponse.from_paper(paper)


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
    # TODO: Reimplement vector DB indexing
    # await vector_db_service.index_paper(
    #     paper_id=paper.id,
    #     title_embedding=embeddings["title"],
    #     abstract_embedding=embeddings["abstract"],
    #     metadata={
    #         "title": paper.title,
    #         "domain": paper.domain,
    #         "published_at": paper.published_at.isoformat()
    #     }
    # )
    
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
    # TODO: Reimplement vector DB deletion
    # await vector_db_service.delete_paper(paper_id)

    # Delete from database (cascade will handle related records)
    await db.delete(paper)
    await db.commit()

    return {"message": "Paper deleted successfully"}


@router.get("/{paper_id}/pdf")
async def get_paper_pdf(
    paper_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Serve paper PDF through backend (proxy for S3)"""
    # Get paper
    query = select(Paper).where(Paper.id == paper_id)
    result = await db.execute(query)
    paper = result.scalar_one_or_none()

    if not paper or not paper.pdf_url:
        raise HTTPException(status_code=404, detail="PDF not found")

    # Extract S3 key from URL
    parsed_url = urlparse(paper.pdf_url)
    s3_key = parsed_url.path.lstrip('/')

    # Remove bucket name from key if present
    bucket_name = settings.S3_BUCKET_NAME
    if s3_key.startswith(f"{bucket_name}/"):
        s3_key = s3_key[len(bucket_name)+1:]

    # Get file from S3
    try:
        file_content = await storage_service.download_file(s3_key)

        return StreamingResponse(
            io.BytesIO(file_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{paper.arxiv_id or paper.id}.pdf"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to retrieve PDF: {str(e)}") 