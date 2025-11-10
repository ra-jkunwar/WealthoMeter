"""
API v1 router
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, families, accounts, transactions, dashboard, exports, messages

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(families.router, prefix="/families", tags=["families"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(exports.router, prefix="/exports", tags=["exports"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])

