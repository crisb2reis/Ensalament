from sqlalchemy import Column, String, Integer, Boolean, Enum as SQLEnum, ForeignKey, Table, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum
import uuid
import datetime
from typing import List, Optional

class RoomType(str, enum.Enum):
    COMMON = "Sala Comum"
    LABORATORY = "Laboratório"
    AUDITORIUM = "Auditório"
    MULTIMEDIA = "Multimídia"

class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campus: Mapped[str] = mapped_column(String(100))
    building: Mapped[str] = mapped_column(String(100))
    block: Mapped[str] = mapped_column(String(50))
    floor: Mapped[int] = mapped_column(Integer)
    number: Mapped[str] = mapped_column(String(50), unique=True)
    capacity: Mapped[int] = mapped_column(Integer)
    type: Mapped[RoomType] = mapped_column(SQLEnum(RoomType), default=RoomType.COMMON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    schedules = relationship("Schedule", back_populates="room")

class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    workload: Mapped[int] = mapped_column(Integer)
    required_room_type: Mapped[RoomType] = mapped_column(SQLEnum(RoomType), default=RoomType.COMMON)
    offered_month: Mapped[str] = mapped_column(String(50))
    
    # Relacionamento N:N com Cursos
    courses = relationship("Course", secondary="subject_courses", back_populates="subjects")

subject_courses = Table(
    "subject_courses",
    Base.metadata,
    Column("subject_id", ForeignKey("subjects.id"), primary_key=True),
    Column("course_id", ForeignKey("courses.id"), primary_key=True),
)

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    code: Mapped[str] = mapped_column(String(50), unique=True)
    
    classes = relationship("SchoolClass", back_populates="course")
    subjects = relationship("Subject", secondary="subject_courses", back_populates="courses")

class SchoolClass(Base):
    __tablename__ = "school_classes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100))
    shift: Mapped[str] = mapped_column(String(50))
    semester: Mapped[int] = mapped_column(Integer)
    students_count: Mapped[int] = mapped_column(Integer, default=0)
    
    course_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("courses.id"))
    course = relationship("Course", back_populates="classes")
    
    subject_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("subjects.id"), nullable=True)
    subject = relationship("Subject")
    
    schedules = relationship("Schedule", back_populates="school_class")

class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    days_of_week: Mapped[list] = mapped_column(JSON)  # Array de dias: [1, 2, 3] = Seg, Ter, Qua
    start_time: Mapped[str] = mapped_column(String(5))
    end_time: Mapped[str] = mapped_column(String(5))
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, approved, rejected

    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rooms.id"))
    school_class_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("school_classes.id"))

    room = relationship("Room", back_populates="schedules")
    school_class = relationship("SchoolClass", back_populates="schedules")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    user: Mapped[str] = mapped_column(String(100))
    action: Mapped[str] = mapped_column(String(100))
    context: Mapped[str] = mapped_column(String(500))
    ip: Mapped[str] = mapped_column(String(50))
    impact: Mapped[str] = mapped_column(String(20)) # Alta, Média, Baixa
    details: Mapped[dict] = mapped_column(JSON, nullable=True)
