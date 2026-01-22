from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.services.audit_service import AuditService
from pydantic import BaseModel
import datetime
from uuid import UUID

class AuditLogSchema(BaseModel):
    id: UUID
    timestamp: datetime.datetime
    user: str
    action: str
    context: str
    ip: str
    impact: str
    details: dict | None

    class Config:
        from_attributes = True

router = APIRouter()

@router.get("/", response_model=List[AuditLogSchema])
async def list_audit_logs(db: AsyncSession = Depends(get_db)):
    return await AuditService.get_all(db)
