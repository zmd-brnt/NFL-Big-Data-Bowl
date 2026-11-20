"""Velocidad máxima por jugador, leída del tracking (811 MB). Se calcula por partido y queda en memoria."""
import threading
from collections.abc import Iterable

import pandas as pd

from .datos import DATA, cargar

# Filas atípicas del tracking (docs/AnalisisData.md, sección 4.5): se excluyen solo para velocidades máximas.
ACELERACION_MAX = 15  # yd/s²
DISTANCIA_MAX = 1.3  # yd por cuadro

_candado = threading.Lock()
_por_partido: dict[int, dict[int, float]] = {}


def _maximos_del_partido(game_id: int) -> dict[int, float]:
    with _candado:
        if game_id not in _por_partido:
            t = pd.read_csv(DATA / "tracking" / f"tracking_{game_id}.csv", usecols=["nflId", "s", "a", "dis"])
            t = t[t.nflId.notna() & (t.a <= ACELERACION_MAX) & (t.dis <= DISTANCIA_MAX)]
            _por_partido[game_id] = {int(k): float(v) for k, v in t.groupby("nflId").s.max().items()}
        return _por_partido[game_id]


def velocidad_maxima(nfl_ids: Iterable[int]) -> dict[int, float]:
    """Máximo de s (yd/s) de cada jugador en todos sus partidos. Solo lee los archivos de esos partidos."""
    ids = set(nfl_ids)
    part = cargar().participaciones
    part = part[part.nflId.isin(ids)]
    salida: dict[int, float] = {}
    for game_id in sorted(part.gameId.unique()):
        for nfl_id, v in _maximos_del_partido(int(game_id)).items():
            if nfl_id in ids and v > salida.get(nfl_id, 0.0):
                salida[nfl_id] = v
    return salida


def calentar() -> None:
    """Lee todos los partidos en segundo plano (unos 20 s) para que /api/players no espere en frío."""
    for game_id in cargar().partidos.gameId:
        _maximos_del_partido(int(game_id))
