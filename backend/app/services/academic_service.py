from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import Course, SchoolClass, Subject
from app.schemas.schemas import CourseCreate, CourseUpdate, SchoolClassCreate, SchoolClassUpdate, SubjectCreate, SubjectUpdate
from typing import List, Optional
from uuid import UUID

class CourseService:
    @staticmethod
    async def get_all(db: AsyncSession) -> List[Course]:
        result = await db.execute(select(Course))
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, course_id: UUID) -> Optional[Course]:
        result = await db.execute(select(Course).filter(Course.id == course_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, course_in: CourseCreate) -> Course:
        db_course = Course(**course_in.model_dump())
        db.add(db_course)
        await db.commit()
        await db.refresh(db_course)
        return db_course

    @staticmethod
    async def update(db: AsyncSession, course_id: UUID, course_in: CourseUpdate) -> Optional[Course]:
        db_course = await CourseService.get_by_id(db, course_id)
        if not db_course:
            return None
        
        update_data = course_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_course, field, value)
            
        await db.commit()
        await db.refresh(db_course)
        return db_course

    @staticmethod
    async def delete(db: AsyncSession, course_id: UUID) -> bool:
        db_course = await CourseService.get_by_id(db, course_id)
        if not db_course:
            return False
        
        await db.delete(db_course)
        await db.commit()
        return True

class SchoolClassService:
    @staticmethod
    async def get_all(db: AsyncSession) -> List[SchoolClass]:
        from sqlalchemy.orm import selectinload
        result = await db.execute(select(SchoolClass).options(selectinload(SchoolClass.subject)))
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, class_id: UUID) -> Optional[SchoolClass]:
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(SchoolClass)
            .filter(SchoolClass.id == class_id)
            .options(selectinload(SchoolClass.subject))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, class_in: SchoolClassCreate) -> SchoolClass:
        db_class = SchoolClass(**class_in.model_dump())
        db.add(db_class)
        await db.commit()
        await db.refresh(db_class)
        # Refetch to load relationships
        return await SchoolClassService.get_by_id(db, db_class.id)

    @staticmethod
    async def update(db: AsyncSession, class_id: UUID, class_in: SchoolClassUpdate) -> Optional[SchoolClass]:
        db_class = await SchoolClassService.get_by_id(db, class_id)
        if not db_class:
            return None
        
        update_data = class_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_class, field, value)
            
        await db.commit()
        await db.refresh(db_class)
        # Refetch to load relationships
        return await SchoolClassService.get_by_id(db, db_class.id)

    @staticmethod
    async def delete(db: AsyncSession, class_id: UUID) -> bool:
        db_class = await SchoolClassService.get_by_id(db, class_id)
        if not db_class:
            return False
        
        await db.delete(db_class)
        await db.commit()
        return True

class SubjectService:
    @staticmethod
    async def get_all(db: AsyncSession) -> List[dict]:
        from sqlalchemy.orm import selectinload
        result = await db.execute(select(Subject).options(selectinload(Subject.courses)))
        subjects = result.scalars().all()
        # Transformar para o formato que o schema espera
        return [
            {
                "id": s.id,
                "code": s.code,
                "name": s.name,
                "workload": s.workload,
                "required_room_type": s.required_room_type,
                "offered_month": s.offered_month,
                "course_ids": [c.id for c in s.courses]
            }
            for s in subjects
        ]

    @staticmethod
    async def get_by_id(db: AsyncSession, subject_id: UUID) -> Optional[dict]:
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(Subject)
            .filter(Subject.id == subject_id)
            .options(selectinload(Subject.courses))
        )
        s = result.scalar_one_or_none()
        if not s:
            return None
        return {
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "workload": s.workload,
            "required_room_type": s.required_room_type,
            "offered_month": s.offered_month,
            "course_ids": [c.id for c in s.courses]
        }

    @staticmethod
    async def create(db: AsyncSession, subject_in: SubjectCreate) -> dict:
        data = subject_in.model_dump()
        course_ids = data.pop("course_ids", [])
        
        db_subject = Subject(**data)
        
        if course_ids:
            result = await db.execute(select(Course).filter(Course.id.in_(course_ids)))
            db_subject.courses = result.scalars().all()
            
        db.add(db_subject)
        await db.commit()
        await db.refresh(db_subject)
        return await SubjectService.get_by_id(db, db_subject.id)

    @staticmethod
    async def update(db: AsyncSession, subject_id: UUID, subject_in: SubjectUpdate) -> Optional[dict]:
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(Subject)
            .filter(Subject.id == subject_id)
            .options(selectinload(Subject.courses))
        )
        db_subject = result.scalar_one_or_none()
        if not db_subject:
            return None
        
        update_data = subject_in.model_dump(exclude_unset=True)
        course_ids = update_data.pop("course_ids", None)
        
        for field, value in update_data.items():
            setattr(db_subject, field, value)
            
        if course_ids is not None:
            result = await db.execute(select(Course).filter(Course.id.in_(course_ids)))
            db_subject.courses = result.scalars().all()
            
        await db.commit()
        await db.refresh(db_subject)
        return await SubjectService.get_by_id(db, db_subject.id)

    @staticmethod
    async def delete(db: AsyncSession, subject_id: UUID) -> bool:
        result = await db.execute(select(Subject).filter(Subject.id == subject_id))
        db_subject = result.scalar_one_or_none()
        if not db_subject:
            return False
        
        await db.delete(db_subject)
        await db.commit()
        return True
