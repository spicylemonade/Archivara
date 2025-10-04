import uuid
from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Table, JSON,
    Boolean, Integer, Float, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.base_class import Base

def uuid_str():
    return str(uuid.uuid4())

class PaperStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    PUBLISHED = "published"
    REJECTED = "rejected"
    RETRACTED = "retracted"

class BaselineStatus(str, enum.Enum):
    PASS = "pass"
    WARN = "warn"
    REJECT = "reject"
    PENDING = "pending"

class VisibilityTier(str, enum.Enum):
    FRONTPAGE = "frontpage"
    MAIN = "main"
    RAW = "raw"
    HIDDEN = "hidden"

# Association tables
paper_authors = Table(
    "paper_authors",
    Base.metadata,
    Column("paper_id", String, ForeignKey("papers.id"), primary_key=True),
    Column("author_id", String, ForeignKey("authors.id"), primary_key=True),
    Column("order", Integer, default=0)
)
paper_models = Table(
    "paper_models",
    Base.metadata,
    Column("paper_id", String, ForeignKey("papers.id"), primary_key=True),
    Column("model_id", String, ForeignKey("models.id"), primary_key=True),
)
paper_tools = Table(
    "paper_tools",
    Base.metadata,
    Column("paper_id", String, ForeignKey("papers.id"), primary_key=True),
    Column("tool_id", String, ForeignKey("tools.id"), primary_key=True),
)

class Paper(Base):
    __tablename__ = "papers"
    id = Column(String, primary_key=True, default=uuid_str)
    title = Column(String, nullable=False, index=True)
    abstract = Column(Text, nullable=False)
    arxiv_id = Column(String, unique=True, index=True)
    doi = Column(String, unique=True, index=True)
    published_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    # Files
    pdf_url = Column(String)
    pdf_hash = Column(String)
    tex_url = Column(String)
    tex_hash = Column(String)
    code_url = Column(String)
    data_url = Column(String)
    # Metadata
    categories = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    generation_method = Column(String)
    meta = Column("metadata", JSON, default=dict)
    # Status and submission
    status = Column(Enum(PaperStatus, values_callable=lambda x: [e.value for e in x]), default=PaperStatus.SUBMITTED.value, nullable=False)
    submitter_id = Column(String, ForeignKey("users.id"), nullable=True)

    # Moderation fields
    baseline_status = Column(Enum(BaselineStatus, values_callable=lambda x: [e.value for e in x]), default=BaselineStatus.PENDING.value, nullable=False)
    baseline_checks = Column(JSON, default=dict)  # Store detailed check results
    quality_score = Column(Integer, default=0)  # 0-100
    needs_review = Column(Boolean, default=False)
    red_flags = Column(JSON, default=list)  # Store detected issues
    community_upvotes = Column(Integer, default=0)
    community_downvotes = Column(Integer, default=0)
    flag_count = Column(Integer, default=0)
    visibility_tier = Column(Enum(VisibilityTier, values_callable=lambda x: [e.value for e in x]), default=VisibilityTier.RAW.value, nullable=False)
    moderation_notes = Column(Text, nullable=True)

    # Relationships
    authors = relationship("Author", secondary=paper_authors, back_populates="papers", order_by=paper_authors.c.order)
    models = relationship("Model", secondary=paper_models, back_populates="papers")
    tools = relationship("Tool", secondary=paper_tools, back_populates="papers")
    embeddings = relationship("Embedding", back_populates="paper", cascade="all, delete-orphan")
    submitter = relationship("User", back_populates="submitted_papers")
    votes = relationship("PaperVote", back_populates="paper", cascade="all, delete-orphan")
    flags = relationship("PaperFlag", back_populates="paper", cascade="all, delete-orphan")

class Author(Base):
    __tablename__ = "authors"
    id = Column(String, primary_key=True, default=uuid_str)
    name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, index=True)
    affiliation = Column(String)
    orcid = Column(String, unique=True)
    is_ai_model = Column(Boolean, default=False)
    model_version = Column(String)
    papers = relationship("Paper", secondary=paper_authors, back_populates="authors")

class Model(Base):
    __tablename__ = "models"
    id = Column(String, primary_key=True, default=uuid_str)
    name = Column(String, nullable=False, index=True)
    version = Column(String)
    provider = Column(String)
    model_type = Column(String)
    parameters = Column(JSON)
    papers = relationship("Paper", secondary=paper_models, back_populates="models")

class Tool(Base):
    __tablename__ = "tools"
    
    id = Column(String, primary_key=True, default=uuid_str)
    name = Column(String, nullable=False, index=True)
    category = Column(String)
    url = Column(String)
    papers = relationship("Paper", secondary=paper_tools, back_populates="tools")

class Embedding(Base):
    __tablename__ = "embeddings"
    paper_id = Column(String, ForeignKey("papers.id"), primary_key=True)
    chunk_index = Column(Integer, primary_key=True)
    chunk_text = Column(Text, nullable=False)
    embedding_model = Column(String, nullable=False)
    vector_id = Column(String)
    paper = relationship("Paper", back_populates="embeddings")

class PaperVote(Base):
    """Track user votes on papers (upvote/downvote)"""
    __tablename__ = "paper_votes"

    id = Column(String, primary_key=True, default=uuid_str)
    paper_id = Column(String, ForeignKey("papers.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    vote = Column(Integer, nullable=False)  # 1 for upvote, -1 for downvote
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # Relationships
    paper = relationship("Paper", back_populates="votes")
    user = relationship("User", foreign_keys=[user_id])

class PaperFlag(Base):
    """Track user flags on papers for moderation"""
    __tablename__ = "paper_flags"

    id = Column(String, primary_key=True, default=uuid_str)
    paper_id = Column(String, ForeignKey("papers.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    reason = Column(String, nullable=False)  # spam, plagiarism, low-quality, other
    details = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, reviewed, resolved
    created_at = Column(DateTime(timezone=True), default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String, ForeignKey("users.id"), nullable=True)

    # Relationships
    paper = relationship("Paper", back_populates="flags")
    user = relationship("User", foreign_keys=[user_id])

class SubmissionAttempt(Base):
    """Track submission attempts for spam prevention and cooldown"""
    __tablename__ = "submission_attempts"

    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    paper_id = Column(String, ForeignKey("papers.id"), nullable=True)
    status = Column(String, nullable=False)  # 'accepted', 'rejected'
    rejection_reason = Column(Text, nullable=True)
    # Note: created_at and updated_at are inherited from Base

    # Relationships
    user = relationship("User", foreign_keys=[user_id]) 