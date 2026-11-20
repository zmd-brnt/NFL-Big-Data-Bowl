"""API del dashboard. Arranque en desarrollo (desde la raíz): .venv/bin/uvicorn backend.main:app --reload"""
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.gzip import GZipMiddleware

from . import datos, velocidad
from .rutas import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    datos.cargar()  # falla al arrancar si faltan los CSV, en vez de en la primera petición
    threading.Thread(target=velocidad.calentar, daemon=True).start()
    yield


app = FastAPI(title="Hackathon NFL UNAM", lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(router)

# Producción: el mismo servidor entrega el build del dashboard. Va al final para que /api y /health ganen.
DIST = datos.RAIZ / "dashboard" / "dist"
if DIST.is_dir():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="dashboard")
