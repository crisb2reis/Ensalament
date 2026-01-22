from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import AuditLog
from typing import List

class AuditService:
    @staticmethod
    async def get_all(db: AsyncSession) -> List[AuditLog]:
        result = await db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()))
        return result.scalars().all()

    @staticmethod
    async def log_action(db: AsyncSession, user: str, action: str, context: str, ip: str, impact: str, details: dict = None):
        log = AuditLog(
            user=user,
            action=action,
            context=context,
            ip=ip,
            impact=impact,
            details=details
        )
        db.add(log)
        await db.commit()
        return log
