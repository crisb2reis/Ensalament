from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.dashboard_service import DashboardService

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    return await DashboardService.get_stats(db)

@router.get("/occupancy")
async def get_occupancy(db: AsyncSession = Depends(get_db)):
    return await DashboardService.get_occupancy_data(db)

@router.get("/distribution")
async def get_distribution(db: AsyncSession = Depends(get_db)):
    return await DashboardService.get_room_distribution(db)

@router.get("/conflicts")
async def get_conflicts(db: AsyncSession = Depends(get_db)):
    return await DashboardService.get_conflicts(db)
