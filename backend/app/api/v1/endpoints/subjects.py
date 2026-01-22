from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.schemas.schemas import SubjectInDB, SubjectCreate, SubjectUpdate
from app.services.academic_service import SubjectService

router = APIRouter()

@router.get("/", response_model=List[SubjectInDB])
async def list_subjects(db: AsyncSession = Depends(get_db)):
    return await SubjectService.get_all(db)

@router.post("/", response_model=SubjectInDB, status_code=status.HTTP_201_CREATED)
async def create_subject(subject_in: SubjectCreate, db: AsyncSession = Depends(get_db)):
    return await SubjectService.create(db, subject_in)

@router.get("/{subject_id}", response_model=SubjectInDB)
async def get_subject(subject_id: UUID, db: AsyncSession = Depends(get_db)):
    db_subject = await SubjectService.get_by_id(db, subject_id)
    if not db_subject:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    return db_subject

@router.put("/{subject_id}", response_model=SubjectInDB)
async def update_subject(subject_id: UUID, subject_in: SubjectUpdate, db: AsyncSession = Depends(get_db)):
    db_subject = await SubjectService.update(db, subject_id, subject_in)
    if not db_subject:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    return db_subject

@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(subject_id: UUID, db: AsyncSession = Depends(get_db)):
    success = await SubjectService.delete(db, subject_id)
    if not success:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    return None
