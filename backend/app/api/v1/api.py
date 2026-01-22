from fastapi import APIRouter
from app.api.v1.endpoints import rooms, courses, classes, schedules, dashboard, audit, subjects

api_router = APIRouter()
api_router.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])
api_router.include_router(courses.router, prefix="/courses", tags=["Courses"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
api_router.include_router(classes.router, prefix="/classes", tags=["Classes"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["Schedules"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit"])
