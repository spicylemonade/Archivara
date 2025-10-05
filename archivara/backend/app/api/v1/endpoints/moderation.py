"""
Moderation API endpoints for community filtering and paper quality control.
"""

from typing import List, Optional, Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from pydantic import BaseModel

from app.db.session import get_db
from app.models.paper import Paper, PaperVote, PaperFlag, VisibilityTier, BaselineStatus
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.services.moderation import ModerationService

router = APIRouter()


# Pydantic models for request/response
class VoteRequest(BaseModel):
    vote: int  # 1 for upvote, -1 for downvote, 0 to remove vote

class FlagRequest(BaseModel):
    reason: str  # spam, plagiarism, low-quality, other
    details: Optional[str] = None

class ModerationStatusResponse(BaseModel):
    baseline_status: str
    quality_score: int
    visibility_tier: str
    needs_review: bool
    community_upvotes: int
    community_downvotes: int
    flag_count: int
    red_flags: List[str]
    baseline_checks: dict

class FeedQuery(BaseModel):
    tier: Optional[str] = None  # frontpage, main, raw
    min_score: Optional[int] = None
    exclude_flagged: bool = True


@router.post("/papers/{paper_id}/vote")
async def vote_on_paper(
    paper_id: str,
    vote_request: VoteRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Vote on a paper (upvote/downvote).

    - vote: 1 for upvote, -1 for downvote, 0 to remove vote
    """
    # Validate vote value
    if vote_request.vote not in [-1, 0, 1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vote must be -1, 0, or 1"
        )

    # Get paper
    result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )

    # Check if user already voted
    result = await db.execute(
        select(PaperVote).where(
            and_(
                PaperVote.paper_id == paper_id,
                PaperVote.user_id == current_user.id
            )
        )
    )
    existing_vote = result.scalar_one_or_none()

    if vote_request.vote == 0:
        # Remove vote
        if existing_vote:
            # Update paper vote counts
            if existing_vote.vote == 1:
                paper.community_upvotes = max(0, paper.community_upvotes - 1)
            elif existing_vote.vote == -1:
                paper.community_downvotes = max(0, paper.community_downvotes - 1)

            await db.delete(existing_vote)
            await db.commit()

        return {"message": "Vote removed", "net_votes": paper.community_upvotes - paper.community_downvotes}

    if existing_vote:
        # Update existing vote
        old_vote = existing_vote.vote

        # Remove old vote from counts
        if old_vote == 1:
            paper.community_upvotes = max(0, paper.community_upvotes - 1)
        elif old_vote == -1:
            paper.community_downvotes = max(0, paper.community_downvotes - 1)

        # Add new vote to counts
        if vote_request.vote == 1:
            paper.community_upvotes += 1
        elif vote_request.vote == -1:
            paper.community_downvotes += 1

        existing_vote.vote = vote_request.vote
    else:
        # Create new vote
        new_vote = PaperVote(
            paper_id=paper_id,
            user_id=current_user.id,
            vote=vote_request.vote
        )
        db.add(new_vote)

        # Update paper vote counts
        if vote_request.vote == 1:
            paper.community_upvotes += 1
        elif vote_request.vote == -1:
            paper.community_downvotes += 1

    # Recalculate visibility tier based on new votes
    mod_service = ModerationService(db, use_llm=False)  # Skip LLM for faster voting
    paper.visibility_tier = await mod_service.assign_visibility_tier(paper)

    await db.commit()

    return {
        "message": "Vote recorded",
        "net_votes": paper.community_upvotes - paper.community_downvotes,
        "visibility_tier": paper.visibility_tier.value
    }


@router.post("/papers/{paper_id}/flag")
async def flag_paper(
    paper_id: str,
    flag_request: FlagRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Flag a paper for moderation review.

    Reasons: spam, plagiarism, low-quality, other
    """
    valid_reasons = ['spam', 'plagiarism', 'low-quality', 'other']
    if flag_request.reason not in valid_reasons:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reason must be one of: {', '.join(valid_reasons)}"
        )

    # Get paper
    result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )

    # Check if user already flagged this paper
    result = await db.execute(
        select(PaperFlag).where(
            and_(
                PaperFlag.paper_id == paper_id,
                PaperFlag.user_id == current_user.id,
                PaperFlag.status == "pending"
            )
        )
    )
    existing_flag = result.scalar_one_or_none()
    if existing_flag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already flagged this paper"
        )

    # Create flag
    new_flag = PaperFlag(
        paper_id=paper_id,
        user_id=current_user.id,
        reason=flag_request.reason,
        details=flag_request.details
    )
    db.add(new_flag)

    # Update paper flag count
    paper.flag_count += 1

    # Mark for review if multiple flags
    if paper.flag_count >= 3:
        paper.needs_review = True

    # Recalculate visibility tier
    mod_service = ModerationService(db)
    paper.visibility_tier = await mod_service.assign_visibility_tier(paper)

    await db.commit()

    return {
        "message": "Paper flagged for review",
        "flag_count": paper.flag_count,
        "needs_review": paper.needs_review
    }


@router.get("/papers/{paper_id}/moderation-status", response_model=ModerationStatusResponse)
async def get_moderation_status(
    paper_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get moderation status and metrics for a paper"""
    result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )

    return ModerationStatusResponse(
        baseline_status=paper.baseline_status.value,
        quality_score=paper.quality_score,
        visibility_tier=paper.visibility_tier.value,
        needs_review=paper.needs_review,
        community_upvotes=paper.community_upvotes,
        community_downvotes=paper.community_downvotes,
        flag_count=paper.flag_count,
        red_flags=paper.red_flags or [],
        baseline_checks=paper.baseline_checks or {}
    )


@router.get("/feed")
async def get_feed(
    tier: Optional[str] = Query(None, description="Filter by tier: frontpage, main, raw"),
    min_score: Optional[int] = Query(None, description="Minimum quality score"),
    exclude_flagged: bool = Query(True, description="Exclude heavily flagged papers"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get paper feed with filtering by visibility tier and quality.

    Tiers:
    - frontpage: High-quality, community-endorsed papers
    - main: Default feed, all passing papers
    - raw: Everything, including low-quality (for transparency)
    """
    query = select(Paper).where(Paper.status != "rejected")

    # Filter by tier
    if tier:
        try:
            tier_enum = VisibilityTier[tier.upper()]
            if tier == "frontpage":
                query = query.where(Paper.visibility_tier == VisibilityTier.FRONTPAGE)
            elif tier == "main":
                query = query.where(
                    or_(
                        Paper.visibility_tier == VisibilityTier.MAIN,
                        Paper.visibility_tier == VisibilityTier.FRONTPAGE
                    )
                )
            # For "raw", no additional filter needed
        except KeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid tier. Must be: frontpage, main, or raw"
            )

    # Exclude rejected by baseline checks (unless raw feed)
    if tier != "raw":
        query = query.where(Paper.baseline_status != BaselineStatus.REJECT)

    # Filter by minimum score
    if min_score is not None:
        query = query.where(Paper.quality_score >= min_score)

    # Exclude heavily flagged papers
    if exclude_flagged:
        query = query.where(Paper.flag_count < 5)

    # Order by score (quality + community votes)
    query = query.order_by(
        desc(Paper.quality_score + Paper.community_upvotes - Paper.community_downvotes)
    )

    # Count total
    count_query = select(func.count()).select_from(Paper).where(query.whereclause)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Pagination
    offset = (page - 1) * size
    query = query.offset(offset).limit(size)

    result = await db.execute(query)
    papers = result.scalars().all()

    return {
        "items": papers,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }


@router.post("/papers/{paper_id}/reprocess")
async def reprocess_moderation(
    paper_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Reprocess moderation checks for a paper.
    (Admin/moderator only - add permission check in production)
    """
    result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )

    # Run moderation pipeline
    mod_service = ModerationService(db)
    await mod_service.process_new_submission(paper)

    return {
        "message": "Moderation reprocessed",
        "baseline_status": paper.baseline_status.value,
        "quality_score": paper.quality_score,
        "visibility_tier": paper.visibility_tier.value
    }


@router.get("/papers/{paper_id}/my-vote")
async def get_my_vote(
    paper_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get the current user's vote on a paper"""
    result = await db.execute(
        select(PaperVote).where(
            and_(
                PaperVote.paper_id == paper_id,
                PaperVote.user_id == current_user.id
            )
        )
    )
    vote = result.scalar_one_or_none()

    return {
        "vote": vote.vote if vote else 0,
        "voted_at": vote.created_at if vote else None
    }
