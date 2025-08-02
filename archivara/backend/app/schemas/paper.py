from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from uuid import UUID


class AuthorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: Optional[str] = Field(None, max_length=200)
    orcid: Optional[str] = Field(None, max_length=20)
    affiliation: Optional[str] = Field(None, max_length=300)


class AuthorCreate(AuthorBase):
    pass


class AuthorInDB(AuthorBase):
    id: UUID
    
    class Config:
        from_attributes = True


class ModelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    version: str = Field(..., min_length=1, max_length=50)
    repo_url: Optional[HttpUrl] = None
    architecture: Optional[str] = Field(None, max_length=100)
    parameters_count: Optional[int] = None
    params_json: Optional[Dict[str, Any]] = None
    weights_url: Optional[HttpUrl] = None
    weights_format: Optional[str] = Field(None, max_length=20)
    training_dataset: Optional[str] = Field(None, max_length=200)
    training_compute: Optional[Dict[str, Any]] = None
    performance_metrics: Optional[Dict[str, Any]] = None


class ModelCreate(ModelBase):
    pass


class ModelInDB(ModelBase):
    id: UUID
    paper_id: UUID
    weights_checksum: Optional[str] = None
    
    class Config:
        from_attributes = True


class ToolBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    version: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    tool_type: Optional[str] = Field(None, max_length=50)
    config_json: Optional[Dict[str, Any]] = None
    mcp_compliant: str = Field(default="no", pattern="^(yes|no|partial)$")
    mcp_schema: Optional[Dict[str, Any]] = None
    code_url: Optional[HttpUrl] = None
    language: Optional[str] = Field(None, max_length=20)


class ToolCreate(ToolBase):
    pass


class ToolInDB(ToolBase):
    id: UUID
    paper_id: UUID
    
    class Config:
        from_attributes = True


class PaperBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    abstract: str = Field(..., min_length=10)
    doi: Optional[str] = Field(None, max_length=200)
    arxiv_id: Optional[str] = Field(None, max_length=50)
    published_at: datetime
    version: int = Field(default=1, ge=1)
    language: str = Field(default="en", max_length=10)
    license: str = Field(default="CC-BY-4.0", max_length=50)
    generation_method: Optional[str] = Field(None, max_length=100)
    generation_metadata: Optional[Dict[str, Any]] = None
    domain: List[str] = Field(default_factory=list)
    methodology: List[str] = Field(default_factory=list)
    datasets_used: List[str] = Field(default_factory=list)


class PaperCreate(PaperBase):
    authors: List[AuthorCreate]
    models: List[ModelCreate] = Field(default_factory=list)
    tools: List[ToolCreate] = Field(default_factory=list)
    citation_dois: List[str] = Field(default_factory=list)


class PaperUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    abstract: Optional[str] = Field(None, min_length=10)
    doi: Optional[str] = Field(None, max_length=200)
    domain: Optional[List[str]] = None
    methodology: Optional[List[str]] = None
    datasets_used: Optional[List[str]] = None
    status: Optional[str] = Field(None, pattern="^(pending|published|rejected|retracted)$")
    moderation_notes: Optional[str] = None


class PaperInDB(PaperBase):
    id: UUID
    pdf_url: str
    pdf_hash: Optional[str] = None
    tex_hash: Optional[str] = None
    status: str = "pending"
    cluster_id: Optional[int] = None
    cluster_confidence: Optional[float] = None
    submitter_id: UUID
    created_at: datetime
    updated_at: datetime
    
    # Related objects
    authors: List[AuthorInDB] = Field(default_factory=list)
    models: List[ModelInDB] = Field(default_factory=list)
    tools: List[ToolInDB] = Field(default_factory=list)
    
    model_config = {"from_attributes": True}


class PaperResponse(PaperInDB):
    """Response model for paper endpoints"""
    citation_count: int = 0
    cited_by_count: int = 0
    meta: Optional[dict] = None  # Additional metadata
    generation_method: Optional[str] = None

    @classmethod
    def from_paper(cls, paper: "Paper") -> "PaperResponse":
        """Create PaperResponse from Paper with safe defaults"""
        return cls(
            id=paper.id,
            title=paper.title,
            abstract=paper.abstract,
            arxiv_id=paper.arxiv_id,
            doi=paper.doi,
            published_at=paper.published_at,
            created_at=paper.created_at,
            updated_at=paper.updated_at,
            pdf_url=paper.pdf_url,
            pdf_hash=paper.pdf_hash,
            tex_url=paper.tex_url,
            tex_hash=paper.tex_hash,
            code_url=paper.code_url,
            data_url=paper.data_url,
            categories=paper.categories or [],
            tags=paper.tags or [],
            generation_method=paper.generation_method or "Unknown",
            meta=paper.meta or {},
            status=paper.status,
            submitter_id=paper.submitter_id,
            authors=paper.authors,
            models=paper.models,
            tools=paper.tools,
            citation_count=0,
            cited_by_count=0
        )


class PaperList(BaseModel):
    """Response model for paper list endpoints"""
    items: List[PaperResponse]
    total: int
    page: int
    size: int
    pages: int 