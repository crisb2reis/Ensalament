from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.schemas.schemas import SchoolClassInDB, SchoolClassCreate, SchoolClassUpdate
from app.services.academic_service import SchoolClassService

router = APIRouter()

@router.get("/", response_model=List[SchoolClassInDB])
async def list_classes(db: AsyncSession = Depends(get_db)):
    return await SchoolClassService.get_all(db)

@router.post("/", response_model=SchoolClassInDB, status_code=status.HTTP_201_CREATED)
async def create_class(class_in: SchoolClassCreate, db: AsyncSession = Depends(get_db)):
    return await SchoolClassService.create(db, class_in)

@router.get("/{class_id}", response_model=SchoolClassInDB)
async def get_class(class_id: UUID, db: AsyncSession = Depends(get_db)):
    db_class = await SchoolClassService.get_by_id(db, class_id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return db_class

@router.put("/{class_id}", response_model=SchoolClassInDB)
async def update_class(class_id: UUID, class_in: SchoolClassUpdate, db: AsyncSession = Depends(get_db)):
    db_class = await SchoolClassService.update(db, class_id, class_in)
    if not db_class:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return db_class

@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(class_id: UUID, db: AsyncSession = Depends(get_db)):
    success = await SchoolClassService.delete(db, class_id)
    if not success:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return None
