import pytest
from uuid import uuid4
from app.services.schedule_service import ScheduleService
from app.models.models import Room, SchoolClass, Subject, Course, RoomType

@pytest.fixture
async def setup_data(db_session):
    # Criar sala
    room = Room(
        campus="Centro", building="Bloco A", block="A", floor=1, 
        number="101", capacity=50, type=RoomType.COMMON
    )
    db_session.add(room)
    
    # Criar curso e disciplina
    course = Course(name="Software", code="SW")
    db_session.add(course)
    await db_session.flush()
    
    subject = Subject(
        name="Linguagens", code="LIN01", workload=60, 
        required_room_type=RoomType.COMMON, offered_month="Março"
    )
    subject.courses = [course]
    db_session.add(subject)
    await db_session.flush()
    
    # Criar turma
    school_class = SchoolClass(
        name="TURMA A", shift="Noturno", semester=1, students_count=30,
        course_id=course.id, subject_id=subject.id
    )
    db_session.add(school_class)
    await db_session.commit()
    
    return room, school_class, subject

@pytest.mark.asyncio
async def test_create_schedule(db_session, setup_data):
    room, school_class, _ = setup_data
    
    schedule_data = {
        "room_id": room.id,
        "school_class_id": school_class.id,
        "days_of_week": [1, 2],
        "start_time": "19:00",
        "end_time": "22:00"
    }
    
    schedule = await ScheduleService.create(db_session, schedule_data)
    assert schedule.room_id == room.id
    assert schedule.school_class_id == school_class.id
    assert schedule.status == "pending"

@pytest.mark.asyncio
async def test_auto_scheduling_basic(db_session, setup_data):
    # O setup_data já cria uma turma e uma sala
    # Rodar o ensalamento automático
    schedules = await ScheduleService.run_auto_scheduling(db_session)
    
    assert len(schedules) >= 1
    # Verificar se a turma foi alocada na sala disponível
    assert schedules[0].status == "pending" # Auto-scheduling cria pendentes

@pytest.mark.asyncio
async def test_auto_scheduling_cooperative(db_session):
    # Cenário: Duas turmas da mesma disciplina/mês devem compartilhar a sala se houver capacidade
    room = Room(number="201", capacity=100, campus="C", building="B", block="B", floor=2)
    db_session.add(room)
    
    course = Course(name="C2", code="C2")
    db_session.add(course)
    await db_session.flush()
    
    subject = Subject(name="S2", code="S2", workload=60, offered_month="Abril")
    subject.courses = [course]
    db_session.add(subject)
    await db_session.flush()
    
    c1 = SchoolClass(name="T1", shift="N", semester=1, students_count=40, course_id=course.id, subject_id=subject.id)
    c2 = SchoolClass(name="T2", shift="N", semester=1, students_count=40, course_id=course.id, subject_id=subject.id)
    db_session.add_all([c1, c2])
    await db_session.commit()
    
    schedules = await ScheduleService.run_auto_scheduling(db_session)
    
    # Ambas devem estar na mesma sala (somam 80 < 100)
    assert len(schedules) == 2
    assert schedules[0].room_id == schedules[1].room_id
