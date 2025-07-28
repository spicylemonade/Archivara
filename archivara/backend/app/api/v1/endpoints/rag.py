from fastapi import APIRouter

router = APIRouter()
 
@router.post("/query")
async def rag_query():
    """RAG query endpoint (placeholder)"""
    return {"message": "RAG endpoint - to be implemented"} 