from fastapi import APIRouter

router = APIRouter()
 
@router.post("/")
async def search_papers():
    """Search papers (placeholder)"""
    return {"message": "Search endpoint - to be implemented"} 