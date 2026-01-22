from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import List, Optional
from enum import Enum

class RoomType(str, Enum):
    COMMON = "Sala Comum"
    LABORATORY = "Laboratório"
    AUDITORIUM = "Auditório"
    MULTIMEDIA = "Multimídia"

class RoomBase(BaseModel):
    campus: str
    building: str
    block: str
    floor: int
    number: str
    capacity: int
    type: RoomType = RoomType.COMMON
    is_active: bool = True

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    campus: Optional[str] = None
    building: Optional[str] = None
    block: Optional[str] = None
    floor: Optional[int] = None
    number: Optional[str] = None
    capacity: Optional[int] = None
    type: Optional[RoomType] = None
    is_active: Optional[bool] = None

class RoomInDB(RoomBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

class CourseBase(BaseModel):
    name: str
    code: str

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None

class CourseInDB(CourseBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

# Subject Schemas
class SubjectBase(BaseModel):
    code: str
    name: str
    workload: int
    required_room_type: RoomType = RoomType.COMMON
    offered_month: str

class SubjectCreate(SubjectBase):
    course_ids: List[UUID] = []

class SubjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    workload: Optional[int] = None
    required_room_type: Optional[RoomType] = None
    offered_month: Optional[str] = None
    course_ids: Optional[List[UUID]] = None

class SubjectInDB(SubjectBase):
    id: UUID
    course_ids: List[UUID] = []
    model_config = ConfigDict(from_attributes=True)

# SchoolClass Schemas
class SchoolClassBase(BaseModel):
    name: str
    shift: str
    semester: int
    students_count: int = 0
    course_id: UUID
    subject_id: Optional[UUID] = None

class SchoolClassCreate(SchoolClassBase):
    pass

class SchoolClassUpdate(BaseModel):
    name: Optional[str] = None
    shift: Optional[str] = None
    semester: Optional[int] = None
    students_count: Optional[int] = None
    course_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None

class SchoolClassInDB(SchoolClassBase):
    id: UUID
    subject: Optional["SubjectInDB"] = None
    model_config = ConfigDict(from_attributes=True)
