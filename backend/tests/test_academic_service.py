import pytest
from app.services.academic_service import CourseService, SubjectService, SchoolClassService
from app.schemas.schemas import CourseCreate, SubjectCreate, SchoolClassCreate
from app.models.models import RoomType

@pytest.mark.asyncio
async def test_course_crud(db_session):
    # Create
    course_in = CourseCreate(name="Engenharia de Software", code="ES")
    course = await CourseService.create(db_session, course_in)
    assert course.name == "Engenharia de Software"
    assert course.code == "ES"
    
    # Get all
    courses = await CourseService.get_all(db_session)
    assert len(courses) == 1
    
    # Get by id
    fetched = await CourseService.get_by_id(db_session, course.id)
    assert fetched.id == course.id
    
    # Delete
    deleted = await CourseService.delete(db_session, course.id)
    assert deleted is True
    courses = await CourseService.get_all(db_session)
    assert len(courses) == 0

@pytest.mark.asyncio
async def test_subject_crud(db_session):
    # Create courses for relation
    c1 = await CourseService.create(db_session, CourseCreate(name="C1", code="C1"))
    
    # Create subject
    subj_in = SubjectCreate(
        name="Algoritmos", 
        code="ALG1", 
        workload=80, 
        required_room_type=RoomType.LABORATORY,
        offered_month="Março",
        course_ids=[c1.id]
    )
    subject = await SubjectService.create(db_session, subj_in)
    assert subject["name"] == "Algoritmos"
    assert len(subject["course_ids"]) == 1
    assert subject["course_ids"][0] == c1.id

@pytest.mark.asyncio
async def test_school_class_crud(db_session):
    # Setup dependencies
    course = await CourseService.create(db_session, CourseCreate(name="C1", code="C1"))
    subj = await SubjectService.create(db_session, SubjectCreate(
        name="S1", code="S1", workload=40, offered_month="Abril", course_ids=[course.id]
    ))
    
    # Create class
    class_in = SchoolClassCreate(
        name="Turma A 2024",
        shift="Noturno",
        semester=1,
        students_count=40,
        course_id=course.id,
        subject_id=subj["id"]
    )
    school_class = await SchoolClassService.create(db_session, class_in)
    assert school_class.name == "Turma A 2024"
    assert school_class.subject.name == "S1"
