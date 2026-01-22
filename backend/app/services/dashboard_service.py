from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.models import Room, SchoolClass, Schedule, RoomType
from typing import Dict, Any, List

class DashboardService:
    @staticmethod
    async def get_stats(db: AsyncSession) -> Dict[str, Any]:
        from sqlalchemy.orm import selectinload
        
        # Count rooms
        rooms_count_result = await db.execute(select(func.count(Room.id)))
        rooms_count = rooms_count_result.scalar() or 0
        
        # Count classes
        classes_count_result = await db.execute(select(func.count(SchoolClass.id)))
        classes_count = classes_count_result.scalar() or 0
        
        # Count schedules (allocation)
        schedules_count_result = await db.execute(select(func.count(Schedule.id)))
        schedules_count = schedules_count_result.scalar() or 0
        
        # Detect capacity conflicts
        schedules_result = await db.execute(
            select(Schedule)
            .options(selectinload(Schedule.room), selectinload(Schedule.school_class))
        )
        schedules = schedules_result.scalars().all()
        
        conflicts_count = 0
        for schedule in schedules:
            if schedule.room and schedule.school_class:
                if schedule.school_class.students_count > schedule.room.capacity:
                    conflicts_count += 1
        
        completion = 0
        if classes_count > 0:
            completion = min(100, int((schedules_count / classes_count) * 100))

        return {
            "total_rooms": rooms_count,
            "active_classes": classes_count,
            "pending_conflicts": conflicts_count,
            "completion_rate": f"{completion}%"
        }

    @staticmethod
    async def get_occupancy_data(db: AsyncSession) -> List[Dict[str, Any]]:
        # Group rooms by block and calculate occupancy
        # For MVP: Ocupação = count of schedules in that block, Capacidade = sum of room capacities in that block
        result = await db.execute(
            select(
                Room.block,
                func.sum(Room.capacity).label("total_capacity"),
                func.count(Schedule.id).label("scheduled_count")
            )
            .outerjoin(Schedule, Room.id == Schedule.room_id)
            .group_by(Room.block)
        )
        
        data = []
        for row in result.all():
            data.append({
                "name": row.block,
                "ocupacao": row.scheduled_count,
                "capacidade": row.total_capacity or 0
            })
            
        if not data:
            return [{"name": "Sem Dados", "ocupacao": 0, "capacidade": 0}]
        return data

    @staticmethod
    async def get_room_distribution(db: AsyncSession) -> List[Dict[str, Any]]:
        result = await db.execute(
            select(Room.type, func.count(Room.id))
            .group_by(Room.type)
        )
        
        data = []
        for row in result.all():
            data.append({
                "name": row[0].value if hasattr(row[0], 'value') else str(row[0]),
                "value": row[1]
            })
        
        if not data:
            return [{"name": "Nenhuma", "value": 1}]
        return data

    @staticmethod
    async def get_conflicts(db: AsyncSession) -> List[Dict[str, Any]]:
        from sqlalchemy.orm import selectinload
        
        # Buscar todos os schedules com relacionamentos
        result = await db.execute(
            select(Schedule)
            .options(selectinload(Schedule.room), selectinload(Schedule.school_class))
        )
        schedules = result.scalars().all()
        
        conflicts = []
        for schedule in schedules:
            if schedule.room and schedule.school_class:
                room_capacity = schedule.room.capacity
                students_count = schedule.school_class.students_count
                
                # Detectar conflito de capacidade
                if students_count > room_capacity:
                    conflicts.append({
                        "id": str(schedule.id),
                        "class_name": schedule.school_class.name,
                        "room_number": schedule.room.number,
                        "students": students_count,
                        "capacity": room_capacity,
                        "severity": "Alta",
                        "description": f"Sala {schedule.room.number} tem {room_capacity} vagas mas a turma {schedule.school_class.name} possui {students_count} alunos"
                    })
        
        return conflicts
