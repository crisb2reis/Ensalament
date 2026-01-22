from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, List
from .schemas import RoomInDB, SchoolClassInDB

class ScheduleBase(BaseModel):
    days_of_week: List[int]  # Array de dias: [1, 2, 3] para Seg, Ter, Qua
    start_time: str
    end_time: str
    room_id: UUID
    school_class_id: UUID
    status: str = "pending"  # pending, approved, rejected

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(BaseModel):
    days_of_week: Optional[List[int]] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room_id: Optional[UUID] = None
    status: Optional[str] = None

class ScheduleInDB(ScheduleBase):
    id: UUID
    room: Optional[RoomInDB] = None
    school_class: Optional[SchoolClassInDB] = None
    
    model_config = ConfigDict(from_attributes=True)
