from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.schemas.schemas import RoomInDB, RoomCreate, RoomUpdate
from app.services.room_service import RoomService

router = APIRouter()

@router.get("/", response_model=List[RoomInDB])
async def list_rooms(db: AsyncSession = Depends(get_db)):
    return await RoomService.get_all(db)

@router.post("/", response_model=RoomInDB, status_code=status.HTTP_201_CREATED)
async def create_room(room_in: RoomCreate, db: AsyncSession = Depends(get_db)):
    return await RoomService.create(db, room_in)

@router.get("/{room_id}", response_model=RoomInDB)
async def get_room(room_id: UUID, db: AsyncSession = Depends(get_db)):
    room = await RoomService.get_by_id(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Sala não encontrada")
    return room

@router.put("/{room_id}", response_model=RoomInDB)
async def update_room(room_id: UUID, room_in: RoomUpdate, db: AsyncSession = Depends(get_db)):
    room = await RoomService.update(db, room_id, room_in)
    if not room:
        raise HTTPException(status_code=404, detail="Sala não encontrada")
    return room

@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(room_id: UUID, db: AsyncSession = Depends(get_db)):
    success = await RoomService.delete(db, room_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sala não encontrada")
    return None
