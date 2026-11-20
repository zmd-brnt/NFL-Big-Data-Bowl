"""Una función por vista del dashboard (dashboard/src/data/index.ts). Cada una agrega sobre las jugadas válidas."""
from functools import cache
from typing import Literal

import pandas as pd

from .datos import cargar
from .velocidad import velocidad_maxima

Bucket = Literal["1-3", "4-6", "7-10", "11+"]
LIMITES_BUCKET: dict[str, tuple[int, int]] = {"1-3": (0, 3), "4-6": (4, 6), "7-10": (7, 10), "11+": (11, 99)}
KPI = ("comp", "ya", "press", "sack")

# Ejes que el dashboard tiene fijos (sample/teams.ts) y términos del glosario que conoce.
FORMACIONES = ("SHOTGUN", "EMPTY", "SINGLEBACK", "I_FORM", "PISTOL")
COBERTURAS = ("Cover-3", "Cover-1", "Cover-2", "Quarters", "2-Man", "Cover-0")

# Muestras mínimas, para que un valor con pocas jugadas no gane un destacado ni pinte una celda.
MIN_INTENTOS_CELDA = 20
MIN_INTENTOS_QB = 100  # destacado "Player of the weeks"
MIN_DROPBACKS_QB = 20  # lista de la página Players
MIN_SNAPS_RUSHER = 100
MIN_SNAPS_BLOQUEADOR = 150
MIN_SNAPS_DUELO = 20
MIN_PCT_CATEGORIA = 1.0  # en Teams, categorías con menos de 1% de la liga van a "Other"


def r1(x: float) -> float:
    return round(float(x), 1)


def agregar(jugadas: pd.DataFrame, por: str | list[str]) -> pd.DataFrame:
    """Métricas de ataque por grupo: comp (% de completos), ya (yardas por intento), press y sack (% de dropbacks)."""
    a = jugadas.groupby(por).agg(
        jugadas=("playId", "size"), intentos=("intento", "sum"), completos=("completo", "sum"),
        yardas=("yardasIntento", "sum"), sacks=("sack", "sum"), presionadas=("presionada", "sum"),
        primerDown=("primerDown", "sum"),
    )
    a["comp"] = 100 * a.completos / a.intentos
    a["ya"] = a.yardas / a.intentos
    a["press"] = 100 * a.presionadas / a.jugadas
    a["sack"] = 100 * a.sacks / a.jugadas
    a["firstDown"] = 100 * a.primerDown / a.jugadas
    return a


def plays(down: int | None, quarter: int | None, bucket: Bucket | None) -> list[dict]:
    """Jugadas en orden cronológico. Los textos vacíos de los datos salen como cadena vacía."""
    j = cargar().jugadas
    if down is not None:
        j = j[j.down == down]
    if quarter is not None:
        j = j[j.quarter == quarter]
    if bucket is not None:
        bajo, alto = LIMITES_BUCKET[bucket]
        j = j[j.yardsToGo.between(bajo, alto)]
    columnas = ["gameId", "playId", "quarter", "gameClock", "down", "yardsToGo", "possessionTeam", "defensiveTeam",
                "yardlineSide", "yardlineNumber", "offenseFormation", "pff_passCoverage", "pff_playAction",
                "passResult", "prePenaltyPlayResult", "playDescription"]
    texto = ["yardlineSide", "offenseFormation", "pff_passCoverage"]
    j = j[columnas].copy()
    j[texto] = j[texto].fillna("")
    return j.to_dict("records")


def games(week: int) -> list[dict]:
    d = cargar()
    por_equipo = agregar(d.jugadas[d.jugadas.week == week], ["gameId", "possessionTeam"])

    def stats(game_id: int, equipo: str) -> dict:
        s = por_equipo.loc[(game_id, equipo)]
        return {"comp": r1(s.comp), "ya": r1(s.ya), "press": r1(s.press), "sack": r1(s.sack), "attempts": int(s.intentos)}

    semana = d.partidos[d.partidos.week == week].sort_values(["kickoffIso", "gameId"])
    return [
        {
            "gameId": int(g.gameId), "week": int(g.week), "home": g.homeTeamAbbr, "away": g.visitorTeamAbbr,
            "kickoffIso": g.kickoffIso,
            "stats": {"home": stats(g.gameId, g.homeTeamAbbr), "away": stats(g.gameId, g.visitorTeamAbbr)},
        }
        for g in semana.itertuples()
    ]


def _resumen(jugadas: pd.DataFrame) -> pd.Series:
    return agregar(jugadas.assign(todos=1), "todos").iloc[0]


def _jugador(nfl_id: int) -> pd.Series:
    return cargar().jugadores.set_index("nflId").loc[nfl_id]


def _compartir(serie: pd.Series, categorias: list[str]) -> list[dict]:
    """Porcentaje de jugadas por categoría. Lo que no está en `categorias` se suma en "Other"."""
    cuentas = serie.value_counts()
    filas = [{"name": c, "share": r1(100 * cuentas.get(c, 0) / len(serie))} for c in categorias]
    otras = len(serie) - sum(int(cuentas.get(c, 0)) for c in categorias)
    if otras:
        filas.append({"name": "Other", "share": r1(100 * otras / len(serie))})
    return filas


@cache
def teams() -> list[dict]:
    """Perfil ofensivo de cada equipo. `weekly` solo trae las semanas que jugó (hay semanas de descanso)."""
    j = cargar().jugadas
    medias = agregar(j, "possessionTeam")
    semanal = agregar(j, ["possessionTeam", "week"])
    liga_cob = 100 * j.pff_passCoverage.value_counts(normalize=True)
    coberturas = [c for c in liga_cob.index if liga_cob[c] >= MIN_PCT_CATEGORIA]
    perfiles = []
    for equipo, m in medias.iterrows():
        propias = j[j.possessionTeam == equipo]
        semanas = semanal.loc[equipo]
        perfiles.append({
            "id": equipo,
            "weekly": {k: [r1(v) for v in semanas[k]] for k in KPI},
            "avg": {k: r1(m[k]) for k in KPI},
            "formations": _compartir(propias.offenseFormation.fillna("UNKNOWN"), list(FORMACIONES)),
            "coverages": _compartir(propias.pff_passCoverage, coberturas),
        })
    return perfiles


@cache
def overview() -> dict:
    d = cargar()
    j = d.jugadas
    semanal = agregar(j, "week").reindex(range(1, 9))
    liga = _resumen(j)

    cobertura = agregar(j[j.pff_passCoverage.isin(COBERTURAS)], "pff_passCoverage").sort_values("comp", ascending=False)

    # Mejor juego: más yardas por pase combinadas (completos), y de ahí más jugadas de 20 o más yardas.
    comp = j[j.completo].assign(grande=lambda x: x.prePenaltyPlayResult >= 20)
    juegos = comp.groupby("gameId").agg(passYards=("prePenaltyPlayResult", "sum"), bigPlays=("grande", "sum"))
    mejor_id = juegos.sort_values(["passYards", "bigPlays"], ascending=False).index[0]
    g = d.partidos.set_index("gameId").loc[mejor_id]

    # Jugador: mejor QB en yardas por intento con un mínimo de intentos.
    qbs = agregar(j, "qbId")
    qbs = qbs[qbs.intentos >= MIN_INTENTOS_QB].sort_values("ya", ascending=False)
    qb_id = int(qbs.index[0])
    qb = _jugador(qb_id)

    # Equipo: mejor ataque aéreo en yardas por intento.
    equipos = agregar(j, "possessionTeam").sort_values("ya", ascending=False)

    # Pass rusher: más presiones (hits + hurries + sacks), luego más sacks.
    rush = d.pff[d.pff.pff_role == "Pass Rush"].groupby("nflId").agg(
        pressures=("pff_hit", "sum"), hurries=("pff_hurry", "sum"), sacks=("pff_sack", "sum"))
    rush["pressures"] += rush.hurries + rush.sacks
    top = rush.sort_values(["pressures", "sacks"], ascending=False).iloc[0]
    rush_id = int(rush.sort_values(["pressures", "sacks"], ascending=False).index[0])
    rs = _jugador(rush_id)

    # Jugada destacada: el pase completo más largo en 3.er down (con tiempo al lanzamiento conocido).
    candidatas = j[j.completo & (j.down == 3) & j.tiempoAlLanzamiento.notna()]
    f = candidatas.sort_values(["prePenaltyPlayResult", "gameId", "playId"], ascending=[False, True, True]).iloc[0]

    # Ganancia del play action en yardas por intento en 3.er down (lo que dice tp.n3 del dashboard).
    tercero = agregar(j[j.down == 3], "pff_playAction")

    return {
        "weeklyKpi": {k: [r1(v) for v in semanal[k]] for k in KPI},
        "coverage": [{"pff_passCoverage": c, "compPct": r1(r.comp)} for c, r in cobertura.iterrows()],
        "leagueComp": r1(liga.comp),
        "best": {
            "away": g.visitorTeamAbbr, "home": g.homeTeamAbbr, "week": int(g.week), "kickoffIso": g.kickoffIso,
            "passYards": int(juegos.loc[mejor_id, "passYards"]), "bigPlays": int(juegos.loc[mejor_id, "bigPlays"]),
        },
        "player": {
            "name": qb.displayName, "pos": qb.officialPosition, "team": qb.team, "jersey": int(qb.jerseyNumber),
            "college": None if pd.isna(qb.collegeName) else qb.collegeName,
            "yardsPerAttempt": r1(qbs.loc[qb_id, "ya"]), "compPct": r1(qbs.loc[qb_id, "comp"]),
            "heightIn": int(qb.heightInches), "weightLb": int(qb.weight),
        },
        "team": {"id": equipos.index[0], "yardsPerAttempt": r1(equipos.iloc[0].ya), "pressedPct": r1(equipos.iloc[0].press)},
        "rusher": {
            "name": rs.displayName, "pos": rs.officialPosition, "team": rs.team, "jersey": int(rs.jerseyNumber),
            "pressures": int(top.pressures), "sacks": int(top.sacks),
            "topSpeedYdS": round(velocidad_maxima([rush_id])[rush_id], 2),
        },
        "featuredPlay": {
            "down": int(f.down), "yardsToGo": int(f.yardsToGo),
            "yardlineSide": "" if pd.isna(f.yardlineSide) else f.yardlineSide, "yardlineNumber": int(f.yardlineNumber),
            "offenseFormation": f.offenseFormation, "pff_passCoverage": f.pff_passCoverage, "rushers": int(f.rushers),
            "timeToThrowS": float(f.tiempoAlLanzamiento), "playResult": int(f.prePenaltyPlayResult),
            "offense": f.possessionTeam, "defense": f.defensiveTeam,
        },
        "playActionGain": r1(tercero.loc[1, "ya"] - tercero.loc[0, "ya"]),
        "pressureLowWeek": int(semanal.press.idxmin()),
    }


def _ficha(nfl_id: int, group: str, metrics: dict[str, float]) -> dict:
    p = _jugador(nfl_id)
    return {
        "nflId": nfl_id, "displayName": p.displayName, "officialPosition": p.officialPosition, "group": group,
        "team": p.team, "jersey": int(p.jerseyNumber), "heightIn": int(p.heightInches), "weightLb": int(p.weight),
        "collegeName": None if pd.isna(p.collegeName) else p.collegeName,
        "age": None if pd.isna(p.edad) else int(p.edad), "metrics": metrics,
    }


@cache
def players() -> list[dict]:
    """QBs (≥20 dropbacks), pass rushers (≥100 snaps) y bloqueadores de pase (≥150 snaps)."""
    d = cargar()
    j, pff = d.jugadas, d.pff
    fichas = []

    qb = agregar(j, "qbId").join(j.groupby("qbId").tiempoAlLanzamiento.mean().rename("ttt"))
    for nfl_id, r in qb[qb.jugadas >= MIN_DROPBACKS_QB].dropna(subset=["comp", "ya", "ttt"]).iterrows():
        fichas.append(_ficha(int(nfl_id), "QB", {
            "compPct": r1(r.comp), "yardsPerAttempt": r1(r.ya), "pressuredPct": r1(r.press), "timeToThrowS": r1(r.ttt)}))

    rush = pff[pff.pff_role == "Pass Rush"].groupby("nflId").agg(
        snaps=("playId", "size"), hits=("pff_hit", "sum"), hurries=("pff_hurry", "sum"), sacks=("pff_sack", "sum"))
    rush = rush[rush.snaps >= MIN_SNAPS_RUSHER]
    velocidades = velocidad_maxima(rush.index)
    for nfl_id, r in rush.iterrows():
        fichas.append(_ficha(int(nfl_id), "RUSH", {
            "pressures": int(r.hits + r.hurries + r.sacks), "sacks": int(r.sacks), "hurries": int(r.hurries),
            "topSpeedYdS": round(velocidades[int(nfl_id)], 2)}))

    blk = pff[pff.pff_role == "Pass Block"].groupby("nflId").agg(
        snaps=("playId", "size"), beaten=("pff_beatenByDefender", "sum"), hit=("pff_hitAllowed", "sum"),
        hurry=("pff_hurryAllowed", "sum"), sack=("pff_sackAllowed", "sum"))
    for nfl_id, r in blk[blk.snaps >= MIN_SNAPS_BLOQUEADOR].iterrows():
        fichas.append(_ficha(int(nfl_id), "BLOCK", {
            "blocksWonPct": r1(100 * (1 - r.beaten / r.snaps)), "pressuresAllowed": int(r.hit + r.hurry + r.sack),
            "sacksAllowed": int(r.sack), "snaps": int(r.snaps)}))
    return fichas


@cache
def matchups(min_snaps: int, limit: int) -> list[dict]:
    """Duelos bloqueador contra pass rusher: pares con al menos `min_snaps` jugadas enfrentados."""
    d = cargar()
    pb = d.pff[(d.pff.pff_role == "Pass Block") & d.pff.pff_nflIdBlockedPlayer.notna()]
    rushers = d.pff[d.pff.pff_role == "Pass Rush"][["gameId", "playId", "nflId"]].rename(columns={"nflId": "rusher"})
    pb = pb.assign(rusher=pb.pff_nflIdBlockedPlayer.astype(int)).merge(rushers, on=["gameId", "playId", "rusher"])
    pares = pb.groupby(["nflId", "rusher"]).agg(
        snaps=("playId", "size"), beaten=("pff_beatenByDefender", "sum"), hit=("pff_hitAllowed", "sum"),
        hurry=("pff_hurryAllowed", "sum"), sack=("pff_sackAllowed", "sum"))
    pares = pares[pares.snaps >= min_snaps].reset_index()
    pares = pares.sort_values(["snaps", "nflId", "rusher"], ascending=[False, True, True]).head(limit)
    gente = d.jugadores.set_index("nflId")

    def persona(nfl_id: int) -> dict:
        p = gente.loc[nfl_id]
        return {"name": p.displayName, "team": p.team, "pos": p.officialPosition}

    return [
        {
            "id": i, "blocker": persona(r.nflId), "rusher": persona(r.rusher), "snaps": int(r.snaps),
            "blocksWonPct": r1(100 * (1 - r.beaten / r.snaps)), "pressuresAllowed": int(r.hit + r.hurry + r.sack),
            "sacksAllowed": int(r.sack),
        }
        for i, r in enumerate(pares.itertuples(), start=1)
    ]


@cache
def schemes() -> dict:
    j = cargar().jugadas
    base = j[j.offenseFormation.isin(FORMACIONES) & j.pff_passCoverage.isin(COBERTURAS)]
    celdas = agregar(base, ["offenseFormation", "pff_passCoverage"])
    celdas = celdas[celdas.intentos >= MIN_INTENTOS_CELDA]
    pa = agregar(j, "pff_playAction")

    def lado(i: int) -> dict:
        return {"plays": int(pa.loc[i, "jugadas"]), "compPct": r1(pa.loc[i, "comp"]), "yardsPerAttempt": r1(pa.loc[i, "ya"])}

    return {
        "cells": [
            {"formation": f, "coverage": c, "plays": int(r.jugadas), "compPct": r1(r.comp), "yardsPerAttempt": r1(r.ya)}
            for (f, c), r in celdas.iterrows()
        ],
        "playAction": {"withPlayAction": lado(1), "without": lado(0)},
    }


@cache
def situations() -> dict:
    j = cargar().jugadas
    tempranos = j[j.down.between(1, 3)].copy()
    tempranos["bucket"] = pd.cut(tempranos.yardsToGo, [-1, 3, 6, 10, 99], labels=list(LIMITES_BUCKET)).astype(str)
    celdas = agregar(tempranos, ["down", "bucket"])
    celdas = celdas[celdas.intentos >= MIN_INTENTOS_CELDA]

    zona_roja = j.yardasAZona <= 20
    dos_minutos = j.quarter.isin([2, 4]) & (j.segundosCuarto <= 120)
    grupos = {"redZone": j[zona_roja], "twoMinute": j[dos_minutos], "rest": j[~zona_roja & ~dos_minutos]}
    return {
        "matrix": [
            {"down": int(down), "bucket": bucket, "plays": int(r.jugadas), "compPct": r1(r.comp),
             "yardsPerAttempt": r1(r.ya), "firstDownPct": r1(r.firstDown)}
            for (down, bucket), r in celdas.iterrows()
        ],
        "special": [
            {"id": k, "plays": int(r.jugadas), "compPct": r1(r.comp), "yardsPerAttempt": r1(r.ya), "sackPct": r1(r.sack)}
            for k, g in grupos.items() for r in [_resumen(g)]
        ],
    }
