from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import Room
from app.schemas.schemas import RoomCreate, RoomUpdate
from typing import List, Optional
from uuid import UUID

class RoomService:
    @staticmethod
    async def get_all(db: AsyncSession) -> List[Room]:
        result = await db.execute(select(Room))
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, room_id: UUID) -> Optional[Room]:
        result = await db.execute(select(Room).filter(Room.id == room_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, room_in: RoomCreate) -> Room:
        db_room = Room(**room_in.model_dump())
        db.add(db_room)
        await db.commit()
        await db.refresh(db_room)
        return db_room

    @staticmethod
    async def update(db: AsyncSession, room_id: UUID, room_in: RoomUpdate) -> Optional[Room]:
        db_room = await RoomService.get_by_id(db, room_id)
        if not db_room:
            return None
        
        update_data = room_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_room, field, value)
            
        await db.commit()
        await db.refresh(db_room)
        return db_room

    @staticmethod
    async def delete(db: AsyncSession, room_id: UUID) -> bool:
        db_room = await RoomService.get_by_id(db, room_id)
        if not db_room:
            return False
        
        await db.delete(db_room)
        await db.commit()
        return True
