from fastapi import APIRouter

router = APIRouter()
 
@router.get("/tools")
async def list_mcp_tools():
    """List available MCP tools (placeholder)"""
    return {"message": "MCP endpoint - to be implemented"} 