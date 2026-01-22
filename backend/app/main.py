from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.db.session import engine, Base
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Ensalament API",
    description="API para gestão de ensalamento universitário",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to create tables
@app.on_event("startup")
async def on_startup():
    logger.info("Iniciando a aplicação e criando tabelas...")
    async with engine.begin() as conn:
        # Note: In a production environment, use Alembic migrations instead
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Tabelas criadas com sucesso.")

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Bem-vindo à API do Ensalament", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
