from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.schemas.schedule_schemas import ScheduleInDB, ScheduleCreate, ScheduleUpdate
from app.services.schedule_service import ScheduleService

router = APIRouter()

@router.get("/", response_model=List[ScheduleInDB])
async def list_schedules(db: AsyncSession = Depends(get_db)):
    return await ScheduleService.get_all(db)

@router.post("/auto-generate", response_model=List[ScheduleInDB])
async def auto_generate_schedules(db: AsyncSession = Depends(get_db)):
    return await ScheduleService.run_auto_scheduling(db)

@router.post("/{schedule_id}/validate", response_model=ScheduleInDB)
async def validate_schedule(
    schedule_id: UUID,
    status: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        schedule = await ScheduleService.validate_schedule(db, schedule_id, status)
        return schedule
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{schedule_id}", response_model=ScheduleInDB)
async def update_schedule(
    schedule_id: UUID,
    schedule_in: ScheduleUpdate,
    db: AsyncSession = Depends(get_db)
):
    try:
        updated_schedule = await ScheduleService.update(db, schedule_id, schedule_in.dict(exclude_unset=True))
        if not updated_schedule:
            raise HTTPException(status_code=404, detail="Schedule não encontrado")
        return updated_schedule
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(schedule_id: UUID, db: AsyncSession = Depends(get_db)):
    success = await ScheduleService.delete(db, schedule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alocação não encontrada")
    return None
