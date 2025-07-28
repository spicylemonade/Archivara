from fastapi import APIRouter

from app.api.v1.endpoints import papers, auth, users, search, mcp, rag

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(papers.router, prefix="/papers", tags=["papers"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
api_router.include_router(mcp.router, prefix="/mcp", tags=["mcp"]) 