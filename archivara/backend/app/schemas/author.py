from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime

class AuthorBase(BaseModel):
    name: str
    email: Optional[str] = None
    affiliation: Optional[str] = None
    orcid: Optional[str] = None
    is_ai_model: bool = False

class AuthorResponse(AuthorBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_author(cls, author):
        return cls(
            id=author.id,
            name=author.name,
            email=author.email,
            affiliation=author.affiliation,
            orcid=author.orcid,
            is_ai_model=author.is_ai_model
        )

class CollaboratorInfo(BaseModel):
    id: str
    name: str
    papers: int

class YearStats(BaseModel):
    year: int
    papers: int
    citations: int

class AuthorDetailResponse(AuthorBase):
    id: str
    h_index: int
    total_citations: int
    total_papers: int
    research_areas: List[str]
    recent_papers: List[Any]  # Will be PaperResponse
    collaborators: List[CollaboratorInfo]
    stats_by_year: List[YearStats]

    model_config = ConfigDict(from_attributes=True)
