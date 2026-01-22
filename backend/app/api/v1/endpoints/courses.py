from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.schemas.schemas import CourseInDB, CourseCreate, CourseUpdate
from app.services.academic_service import CourseService

router = APIRouter()

@router.get("/", response_model=List[CourseInDB])
async def list_courses(db: AsyncSession = Depends(get_db)):
    return await CourseService.get_all(db)

@router.post("/", response_model=CourseInDB, status_code=status.HTTP_201_CREATED)
async def create_course(course_in: CourseCreate, db: AsyncSession = Depends(get_db)):
    return await CourseService.create(db, course_in)

@router.get("/{course_id}", response_model=CourseInDB)
async def get_course(course_id: UUID, db: AsyncSession = Depends(get_db)):
    course = await CourseService.get_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    return course

@router.put("/{course_id}", response_model=CourseInDB)
async def update_course(course_id: UUID, course_in: CourseUpdate, db: AsyncSession = Depends(get_db)):
    course = await CourseService.update(db, course_id, course_in)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    return course

@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(course_id: UUID, db: AsyncSession = Depends(get_db)):
    success = await CourseService.delete(db, course_id)
    if not success:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    return None
