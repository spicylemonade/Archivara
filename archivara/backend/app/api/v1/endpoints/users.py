from fastapi import APIRouter

router = APIRouter()
 
@router.get("/me")
async def get_current_user():
    """Get current user (placeholder)"""
    return {"message": "Users endpoint - to be implemented"} 