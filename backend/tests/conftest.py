"""Fixtures de las pruebas. Los valores esperados se calculan directo de los CSV, sin usar el código del backend."""
from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from backend.main import app

DATA = Path(__file__).resolve().parents[2] / "data"


@pytest.fixture(scope="session")
def client() -> TestClient:
    # Sin "with": no ejecuta el lifespan, que lanzaría la lectura de todo el tracking.
    return TestClient(app)


@pytest.fixture(scope="session")
def validas() -> pd.DataFrame:
    """Jugadas de pase sin anuladas (esNoPlay) ni intentos de 2 puntos (esDosPuntos)."""
    p = pd.read_csv(DATA / "plays.csv")
    return p[(p.esNoPlay == 0) & (p.esDosPuntos == 0)]


@pytest.fixture(scope="session")
def partidos() -> pd.DataFrame:
    return pd.read_csv(DATA / "games.csv")
