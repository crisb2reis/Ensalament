from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.models import Schedule, Room, SchoolClass
from app.schemas.schemas import SchoolClassInDB # Ajudar a carregar dados relacionados
from typing import List, Optional
from uuid import UUID

class ScheduleService:
    @staticmethod
    async def get_all(db: AsyncSession) -> List[Schedule]:
        # Carregar relacionamentos room e school_class
        result = await db.execute(
            select(Schedule).options(
                selectinload(Schedule.room),
                selectinload(Schedule.school_class).selectinload(SchoolClass.subject)
            )
        )
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, schedule_data: dict) -> Schedule:
        # Validação 1: Verificar se a sala tem capacidade suficiente
        room_result = await db.execute(
            select(Room).filter(Room.id == schedule_data['room_id'])
        )
        room = room_result.scalar_one_or_none()
        
        class_result = await db.execute(
            select(SchoolClass).filter(SchoolClass.id == schedule_data['school_class_id'])
        )
        school_class = class_result.scalar_one_or_none()
        
        if not room:
            raise ValueError("Sala não encontrada")
        if not school_class:
            raise ValueError("Turma não encontrada")
            
        # NOTA: Validação de capacidade removida - permitimos alocação mesmo com conflitos
        # A detecção de conflitos continua sendo feita no frontend para alertas
        
        # NOTA: Validação de conflito de horário removida - permitimos múltiplas alocações
        # na mesma sala. A detecção de conflitos é feita no frontend apenas para alertas
        
        db_schedule = Schedule(**schedule_data)
        db.add(db_schedule)
        await db.commit()
        await db.refresh(db_schedule)
        
        # Recarregar com relacionamentos
        result = await db.execute(
            select(Schedule)
            .filter(Schedule.id == db_schedule.id)
            .options(
                selectinload(Schedule.room),
                selectinload(Schedule.school_class)
            )
        )
        return result.scalar_one()

    @staticmethod
    async def update(db: AsyncSession, schedule_id: UUID, schedule_data: dict) -> Optional[Schedule]:
        # Buscar schedule existente
        result = await db.execute(select(Schedule).filter(Schedule.id == schedule_id))
        db_schedule = result.scalar_one_or_none()
        
        if not db_schedule:
            return None
            
        # Se houver atualização de sala, validar se a sala existe
        if 'room_id' in schedule_data:
            room_result = await db.execute(select(Room).filter(Room.id == schedule_data['room_id']))
            if not room_result.scalar_one_or_none():
                raise ValueError("Sala não encontrada")

        # Atualizar campos
        for key, value in schedule_data.items():
            setattr(db_schedule, key, value)
            
        await db.commit()
        await db.refresh(db_schedule)
        
        # Retornar com relacionamentos carregados
        result = await db.execute(
            select(Schedule)
            .filter(Schedule.id == db_schedule.id)
            .options(
                selectinload(Schedule.room),
                selectinload(Schedule.school_class)
            )
        )
        return result.scalar_one()

    @staticmethod
    async def delete(db: AsyncSession, schedule_id: UUID) -> bool:
        result = await db.execute(select(Schedule).filter(Schedule.id == schedule_id))
        db_schedule = result.scalar_one_or_none()
        if not db_schedule:
            return False
        
        await db.delete(db_schedule)
        await db.commit()
        return True

    @staticmethod
    async def validate_schedule(db: AsyncSession, schedule_id: UUID, status: str) -> Schedule:
        """Aprovar ou rejeitar proposta de alocação"""
        if status not in ["approved", "rejected"]:
            raise ValueError("Status deve ser 'approved' ou 'rejected'")
        
        result = await db.execute(
            select(Schedule)
            .filter(Schedule.id == schedule_id)
            .options(
                selectinload(Schedule.room),
                selectinload(Schedule.school_class).selectinload(SchoolClass.subject)
            )
        )
        schedule = result.scalar_one_or_none()
        
        if not schedule:
            raise ValueError("Schedule não encontrado")
        
        schedule.status = status
        await db.commit()
        await db.refresh(schedule)
        return schedule

    @staticmethod
    async def run_auto_scheduling(db: AsyncSession) -> List[Schedule]:
        """
        Algoritmo de ensalamento automático com horários noturnos (19h-22h)
        Implementa alocação cooperativa: turmas da mesma disciplina e período são agrupadas
        """
        # 1. Buscar IDs de turmas já aprovadas
        approved_result = await db.execute(
            select(SchoolClass.id)
            .join(Schedule)
            .filter(Schedule.status == "approved")
        )
        approved_class_ids = {row[0] for row in approved_result.all()}
        
        # 2. Deletar propostas pending antigas
        from sqlalchemy import delete
        await db.execute(delete(Schedule).filter(Schedule.status == "pending"))
        await db.commit()
        
        # 3. Buscar todas as turmas e salas ativas
        rooms_result = await db.execute(select(Room).filter(Room.is_active == True))
        rooms = list(rooms_result.scalars().all())
        
        # Buscar turmas, excluindo as já aprovadas, carregando a Disciplina para agrupamento
        query = select(SchoolClass).options(selectinload(SchoolClass.subject))
        
        if approved_class_ids:
            query = query.filter(SchoolClass.id.not_in(approved_class_ids))
        
        classes_result = await db.execute(query)
        classes = list(classes_result.scalars().all())
        
        if not rooms or not classes:
            return await ScheduleService.get_all(db)
        
        # 4. Ordenar salas por capacidade (maior para menor)
        rooms_sorted = sorted(rooms, key=lambda r: r.capacity, reverse=True)
        
        # 5. Definir parâmetros fixos
        start_time = "19:00"
        end_time = "22:00"
        days_of_week = [1, 2, 3]  # Segunda, Terça, Quarta
        
        # 6. Preparar controle de ocupação
        from collections import defaultdict
        room_occupancy = defaultdict(int)
        
        # Carregar ocupação das salas por turmas já aprovadas
        approved_schedules_details = await db.execute(
            select(Schedule.room_id, SchoolClass.students_count)
            .join(SchoolClass, Schedule.school_class_id == SchoolClass.id)
            .filter(Schedule.status == "approved")
        )
        for row in approved_schedules_details.all():
            room_id, count = row
            room_occupancy[room_id] += (count or 0)

        # 7. Agrupamento Cooperativo (Cooperative Allocation)
        # Agrupar turmas por (subject_id, offered_month)
        grouped_classes = defaultdict(list)
        single_classes = []

        for school_class in classes:
            if school_class.subject_id and school_class.subject and school_class.subject.offered_month:
                key = (school_class.subject.id, school_class.subject.offered_month)
                grouped_classes[key].append(school_class)
            else:
                single_classes.append(school_class)

        # Criar fila de alocação: Grupos e Turmas Individuais
        allocation_queue = []
        for group in grouped_classes.values():
            allocation_queue.append(group)
        for cls in single_classes:
            allocation_queue.append([cls])

        # Ordenar fila por Total de Alunos (menor para maior) para que grupos menores
        # garantam suas salas "na medida" antes que os grandes grupos ocupem tudo.
        allocation_queue.sort(key=lambda group: sum(c.students_count for c in group), reverse=False)

        new_schedules = []

        # 8. Executar Alocação
        for group in allocation_queue:
            group_students = sum(c.students_count for c in group)
            allocated_room = None
            
            # --- TENTATIVA 1: Alocar o GRUPO INTEIRO em uma sala (Exclusiva) ---
            
            # Estratégia Best Fit: Validar todas as salas vazias e pegar a que deixa menos espaço sobrando
            best_fit_room = None
            min_waste = float('inf')

            for room in rooms_sorted:
                if room_occupancy[room.id] == 0 and room.capacity >= group_students:
                    waste = room.capacity - group_students
                    if waste < min_waste:
                        min_waste = waste
                        best_fit_room = room
            
            allocated_room = best_fit_room

            if allocated_room:
                # SUCESSO DE GRUPO: Alocar todas as turmas nesta sala
                for school_class in group:
                    room_occupancy[allocated_room.id] += school_class.students_count
                    schedule = Schedule(
                        days_of_week=days_of_week,
                        start_time=start_time,
                        end_time=end_time,
                        room_id=allocated_room.id,
                        school_class_id=school_class.id
                    )
                    db.add(schedule)
                    new_schedules.append(schedule)
            else:
                # FALHA DE GRUPO: Desmembrar e alocar individualmente
                # Rastrear salas usadas por ESTE grupo para tentar agrupa-los (Cooperative Packing)
                rooms_used_by_group = set()
                
                for school_class in group:
                    cls_room = None

                    # 1. Tentar alocar em sala JÁ USADA pelo grupo (Packing)
                    # Verifica se cabe perfeitamente
                    for r_id in rooms_used_by_group:
                        # Precisamos achar o objeto 'room' pelo ID. O rooms_sorted tem os objetos.
                        # Otimização: Podia ter map, mas N é pequeno.
                        r_obj = next((r for r in rooms_sorted if r.id == r_id), None)
                        if r_obj:
                             remaining = r_obj.capacity - room_occupancy[r_id]
                             if remaining >= school_class.students_count:
                                 cls_room = r_obj
                                 break
                    
                    if not cls_room:
                        # 2. Se não coube nas salas do grupo, buscar sala VAZIA (Best Fit)
                        best_cls_room = None
                        cls_min_waste = float('inf')

                        for room in rooms_sorted:
                            if room_occupancy[room.id] == 0 and room.capacity >= school_class.students_count:
                                 waste = room.capacity - school_class.students_count
                                 if waste < cls_min_waste:
                                     cls_min_waste = waste
                                     best_cls_room = room
                        
                        if best_cls_room:
                            cls_room = best_cls_room
                            rooms_used_by_group.add(cls_room.id)

                    if not cls_room:
                         # 3. Fallback: Sem sala vazia e sem sala do grupo com espaço.
                         # Tentar sala PARCIALMENTE OCUPADA (Sharing Globa) 
                         # Priorizar salas do PRÓPRIO GRUPO mesmo que não caiba? (Superlotação contida)
                         # OU priorizar qualquer sala com espaço?
                         # O usuário sugeriu que "ES-2026-2 deveria ter conflito", mas não "Invadir Sala 1".
                         # Então vamos priorizar: 1) Sala com espaço (qualquer uma), 2) Sala do Grupo (Superlotação).
                         
                         best_share_room = None
                         max_remaining = -1
                         
                         for r in rooms_sorted:
                             remaining = r.capacity - room_occupancy[r.id]
                             if remaining > max_remaining:
                                 max_remaining = remaining
                                 best_share_room = r
                         
                         if best_share_room:
                             cls_room = best_share_room
                             # Se for compartilhada, adicionamos ao "used" para tentar mandar os próximos para cá também?
                             rooms_used_by_group.add(cls_room.id)
                         else:
                             cls_room = rooms_sorted[0]

                    room_occupancy[cls_room.id] += school_class.students_count
                    schedule = Schedule(
                        days_of_week=days_of_week,
                        start_time=start_time,
                        end_time=end_time,
                        room_id=cls_room.id,
                        school_class_id=school_class.id
                    )
                    db.add(schedule)
                    new_schedules.append(schedule)
        
        await db.commit()
        return await ScheduleService.get_all(db)
