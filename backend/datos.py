"""Lectura de data/ (solo lectura) y columnas derivadas. Se calcula una vez por proceso, sin escribir en disco.

Reglas de uso de data/LEEME_datos_limpios.md: las jugadas anuladas (esNoPlay) y los intentos de
2 puntos (esDosPuntos) no entran en ninguna estadística, y las yardas son prePenaltyPlayResult.
"""
from dataclasses import dataclass
from functools import cache
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
DATA = RAIZ / "data"

INTENTOS = ("C", "I", "IN")  # completo, incompleto, intercepción: los pases lanzados
PRIMER_DOWN = ("C", "R")  # mismo criterio que isFirstDown del dashboard
INICIO_TEMPORADA = pd.Timestamp("2021-09-09")


@dataclass(frozen=True)
class Datos:
    partidos: pd.DataFrame  # games.csv + kickoffIso (UTC)
    jugadas: pd.DataFrame  # plays.csv sin anuladas ni 2 puntos, con columnas derivadas
    pff: pd.DataFrame  # pffScoutingData.csv de esas jugadas, banderas sin nulos
    jugadores: pd.DataFrame  # players.csv + equipo, dorsal y edad
    participaciones: pd.DataFrame  # game_players.csv


def _partidos() -> pd.DataFrame:
    g = pd.read_csv(DATA / "games.csv")
    hora = pd.to_datetime(g.kickoffEastern).dt.tz_localize("America/New_York").dt.tz_convert("UTC")
    g["kickoffIso"] = hora.dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    return g


def _jugadas(partidos: pd.DataFrame) -> pd.DataFrame:
    p = pd.read_csv(DATA / "plays.csv")
    p = p[(p.esNoPlay == 0) & (p.esDosPuntos == 0)].copy()
    p["week"] = p.gameId.map(partidos.set_index("gameId").week)
    p["intento"] = p.passResult.isin(INTENTOS)
    p["completo"] = p.passResult.eq("C")
    p["sack"] = p.passResult.eq("S")
    p["yardasIntento"] = p.prePenaltyPlayResult.where(p.intento, 0)
    p["primerDown"] = p.passResult.isin(PRIMER_DOWN) & (p.prePenaltyPlayResult >= p.yardsToGo)
    minutos_segundos = p.gameClock.str.split(":", expand=True).astype(int)
    p["segundosCuarto"] = minutos_segundos[0] * 60 + minutos_segundos[1]
    return p


def _pff(jugadas: pd.DataFrame) -> pd.DataFrame:
    columnas = ["gameId", "playId", "nflId", "pff_role", "pff_hit", "pff_hurry", "pff_sack", "pff_beatenByDefender",
                "pff_hitAllowed", "pff_hurryAllowed", "pff_sackAllowed", "pff_nflIdBlockedPlayer"]
    f = pd.read_csv(DATA / "pffScoutingData.csv", usecols=columnas)
    f = f.merge(jugadas[["gameId", "playId"]], on=["gameId", "playId"])
    banderas = [c for c in columnas if c.startswith("pff_") and c not in ("pff_role", "pff_nflIdBlockedPlayer")]
    f[banderas] = f[banderas].fillna(0).astype("int8")
    return f


def _agregar_presion(jugadas: pd.DataFrame, pff: pd.DataFrame) -> pd.DataFrame:
    """Presión según el análisis: hit, hurry o sack de un jugador con rol Pass Rush."""
    rush = pff[pff.pff_role == "Pass Rush"]
    presion = rush.assign(presion=(rush.pff_hit + rush.pff_hurry + rush.pff_sack) > 0)
    por_jugada = presion.groupby(["gameId", "playId"]).agg(rushers=("nflId", "size"), presionada=("presion", "max"))
    j = jugadas.merge(por_jugada, on=["gameId", "playId"], how="left")
    j["rushers"] = j.rushers.fillna(0).astype(int)
    j["presionada"] = j.presionada.eq(True)
    return j


def _jugadores(participaciones: pd.DataFrame) -> pd.DataFrame:
    pl = pd.read_csv(DATA / "players.csv")
    # Equipo y dorsal del último partido en que jugó (los gameId empiezan con la fecha).
    ultimo = participaciones.sort_values("gameId").drop_duplicates("nflId", keep="last").set_index("nflId")
    pl = pl.join(ultimo[["team", "jerseyNumber"]], on="nflId")
    dias = INICIO_TEMPORADA - pd.to_datetime(pl.birthDate)
    pl["edad"] = (dias.dt.days // 365.25).astype("Int64")
    return pl


@cache
def cargar() -> Datos:
    partidos = _partidos()
    jugadas = _jugadas(partidos)
    pff = _pff(jugadas)
    participaciones = pd.read_csv(DATA / "game_players.csv")
    return Datos(
        partidos=partidos,
        jugadas=_agregar_presion(jugadas, pff),
        pff=pff,
        jugadores=_jugadores(participaciones),
        participaciones=participaciones,
    )
