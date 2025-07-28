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
    status = Column(Enum(PaperStatus), default=PaperStatus.SUBMITTED, nullable=False)
    submitter_id = Column(String, ForeignKey("users.id"), nullable=True)
    # Relationships
    authors = relationship("Author", secondary=paper_authors, back_populates="papers")
    models = relationship("Model", secondary=paper_models, back_populates="papers")
    tools = relationship("Tool", secondary=paper_tools, back_populates="papers")
    embeddings = relationship("Embedding", back_populates="paper", cascade="all, delete-orphan")
    submitter = relationship("User", back_populates="submitted_papers")

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