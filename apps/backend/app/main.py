from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.modules.attendance.router import router as attendance_router
from app.modules.auth.router import router as auth_router
from app.modules.benefits.router import router as benefits_router
from app.modules.contracts.router import router as contracts_router
from app.modules.personnel.router import router as personnel_router
from app.modules.users.router import router as users_router

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=settings.UPLOAD_DIR), name="files")

api_router_prefix = settings.API_V1_PREFIX
app.include_router(auth_router, prefix=api_router_prefix)
app.include_router(users_router, prefix=api_router_prefix)
app.include_router(personnel_router, prefix=api_router_prefix)
app.include_router(contracts_router, prefix=api_router_prefix)
app.include_router(benefits_router, prefix=api_router_prefix)
app.include_router(attendance_router, prefix=api_router_prefix)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
