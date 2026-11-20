#!/usr/bin/env python3
"""Genera las cifras y archivos de apoyo de docs/RelacionesYLimpieza.md.

Solo LEE data/ (nunca la modifica) y escribe en docs/datos_generados/.
Usa únicamente pandas y numpy, que ya forman parte del stack del proyecto.

Uso, desde la raíz del proyecto:
    .venv/bin/python docs/scripts/generar_analisis.py
"""
import glob
import json
import re
import time
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd

RAIZ = Path(__file__).resolve().parents[2]
DATA = RAIZ / "data"
SALIDA = RAIZ / "docs" / "datos_generados"
OFENSA = ["Pass", "Pass Block", "Pass Route"]   # roles PFF del lado ofensivo
M, REL, PERFIL = {}, [], []                      # métricas, relaciones y perfil de columnas


def rel(id_, hija, col_h, padre, col_p, card, filas, sin_padre, nota=""):
    """Registra una relación entre tablas con su cobertura verificada."""
    cob = round(100 * (1 - sin_padre / filas), 2) if filas else None
    REL.append(dict(id=id_, tabla_hija=hija, columna_hija=col_h, tabla_padre=padre, columna_padre=col_p,
                    cardinalidad=card, filas_hija=int(filas), sin_padre=int(sin_padre), cobertura_pct=cob, nota=nota))


def perfil(tabla, df):
    """Añade una fila por columna: tipo, nulos, únicos, mínimo, máximo y ejemplo."""
    for c in df.columns:
        s = df[c].dropna()
        PERFIL.append(dict(tabla=tabla, columna=c, tipo=str(df[c].dtype), filas=len(df),
                           nulos=int(df[c].isna().sum()), pct_nulos=round(100 * df[c].isna().mean(), 2),
                           unicos=int(df[c].nunique()), minimo=s.min() if len(s) else None,
                           maximo=s.max() if len(s) else None, ejemplo=str(s.iloc[0])[:60] if len(s) else None))


def limpiar(o):
    """Convierte tipos de numpy y claves no textuales para poder volcar a JSON."""
    if isinstance(o, dict):
        return {str(k): limpiar(v) for k, v in o.items()}
    if isinstance(o, (list, tuple, set)):
        return [limpiar(v) for v in (sorted(o) if isinstance(o, set) else o)]
    return o.item() if hasattr(o, "item") else o


def cargar():
    leer = lambda n: pd.read_csv(DATA / n)   # 'NA' se lee como nulo (comportamiento por defecto)
    return leer("games.csv"), leer("players.csv"), leer("plays.csv"), leer("pffScoutingData.csv")


# ---------------------------------------------------------------- tracking (una pasada)
def extremos(S, clave, serie):
    if len(serie):
        lo, hi = float(serie.min()), float(serie.max())
        a = S["ext"].get(clave, (lo, hi))
        S["ext"][clave] = (min(a[0], lo), max(a[1], hi))


def revisar_estructura(S, d, jg):
    """Nulos, dependencias funcionales y forma regular de cada archivo."""
    A = S["n"]
    A["filas"] += len(d)
    A["balon"] += int(d.team.eq("football").sum())
    for c in d.columns:
        A["nulos_" + c] += int(d[c].isna().sum())
    A["event_None_texto"] += int(d.event.eq("None").sum())
    A["jugada_con_2_direcciones"] += int((d.groupby("playId").playDirection.nunique() > 1).sum())
    A["cuadro_con_2_eventos"] += int((d[d.event.ne("None")].groupby(["playId", "frameId"]).event.nunique() > 1).sum())
    A["filas_con_llave_duplicada"] += int(d.duplicated(["playId", "frameId", "nflId"]).sum())
    A["filas_por_cuadro_distintas_de_23"] += int((d.groupby(["playId", "frameId"]).size() != 23).sum())
    A["jugadas_sin_22_jugadores"] += int((jg.groupby("playId").nflId.nunique() != 22).sum())
    fr = d.groupby("playId").frameId.agg(["min", "max", "nunique"])
    A["jugadas_con_cuadros_discontinuos"] += int(((fr["min"] != 1) | (fr["max"] - fr["min"] + 1 != fr["nunique"])).sum())
    A["jugador_con_2_equipos_en_partido"] += int((jg.groupby("nflId").team.nunique() > 1).sum())
    A["jugador_con_2_dorsales_en_partido"] += int((jg.groupby("nflId").jerseyNumber.nunique() > 1).sum())
    S["cuadros"].extend(fr["max"].tolist())


def revisar_tiempo(S, d):
    """Cuadros donde 'time' no es único, y a qué filas pertenece la marca distinta."""
    n = d.groupby(["playId", "frameId"]).time.nunique()
    malos = n[n > 1].reset_index()[["playId", "frameId"]]
    S["n"]["cuadros_con_2_marcas_time"] += len(malos)
    if len(malos):
        sub = d.merge(malos, on=["playId", "frameId"])
        moda = sub.groupby(["playId", "frameId"]).time.agg(lambda s: s.mode().iloc[0]).rename("moda").reset_index()
        raro = sub.merge(moda, on=["playId", "frameId"]).query("time != moda")
        S["n"]["filas_time_distinto"] += len(raro)
        S["n"]["filas_time_distinto_balon"] += int(raro.team.eq("football").sum())


def revisar_atipicos(S, jg, bal):
    """Valores fuera de rango, separando jugadores y balón."""
    A = S["n"]
    A["jug_s_mayor_13"] += int((jg.s > 13).sum())
    A["jug_a_abs_mayor_15"] += int((jg.a.abs() > 15).sum())
    A["jug_dis_mayor_1_3"] += int((jg.dis > 1.3).sum())
    A["jug_o_dir_nulos"] += int(jg.o.isna().sum() + jg.dir.isna().sum())
    A["bal_dis_mayor_3"] += int((bal.dis > 3).sum())
    for nom, df in (("jug", jg), ("bal", bal)):
        A[nom + "_x_fuera"] += int(((df.x < 0) | (df.x > 120)).sum())
        A[nom + "_y_fuera"] += int(((df.y < 0) | (df.y > 53.3)).sum())
        for c in ("x", "y", "s", "a", "dis"):
            extremos(S, f"{nom}.{c}", df[c])
    for c in ("o", "dir", "frameId", "jerseyNumber"):
        extremos(S, "jug." + c, jg[c])


def revisar_eventos(S, d, gid):
    """Eventos únicos por cuadro y primer cuadro de cada evento por jugada."""
    ev = d.loc[d.event.ne("None"), ["playId", "frameId", "event"]].drop_duplicates()
    S["ev_cuadros"].update(ev.event.value_counts().to_dict())
    S["ev_jugadas"].update(ev.groupby("event").playId.nunique().to_dict())
    primero = ev.groupby(["playId", "event"]).frameId.min().unstack()
    primero.insert(0, "gameId", gid)
    S["frames"].append(primero.reset_index())


def revisar_contra_pff(S, jg, pf, pos):
    """Compara jugadores de tracking con los de PFF, y su equipo con el lado que dicta el rol."""
    a = jg.drop_duplicates(["playId", "nflId"])[["playId", "nflId", "team"]].assign(nflId=lambda x: x.nflId.astype(int))
    m = a.merge(pf[["playId", "nflId", "pff_role"]], on=["playId", "nflId"], how="outer", indicator=True)
    S["n"]["pares_jugada_jugador_solo_en_uno"] += int((m["_merge"] != "both").sum())
    ambos = m[m["_merge"] == "both"].merge(pos, on="playId")
    esperado = np.where(ambos.pff_role.isin(OFENSA), ambos.possessionTeam, ambos.defensiveTeam)
    S["n"]["pares_con_equipo_distinto_al_del_rol"] += int((ambos.team != esperado).sum())
    S["n"]["pares_jugada_jugador"] += len(ambos)


def pasada_tracking(p, f):
    """Lee cada archivo de tracking una sola vez y acumula todas las comprobaciones."""
    S = dict(n=Counter(), ext={}, cuadros=[], frames=[], jug=[], dirs=[], tiempos=[], ev_cuadros=Counter(), ev_jugadas=Counter())
    pf_juego = dict(tuple(f.groupby("gameId")))
    for fn in sorted(glob.glob(str(DATA / "tracking" / "*.csv"))):
        d = pd.read_csv(fn, na_values=["NA"], keep_default_na=False)   # 'None' queda como texto en event
        S.setdefault("dtypes", d.dtypes.astype(str).to_dict())
        gid = int(d.gameId.iloc[0])
        es_balon = d.team.eq("football")
        bal, jg = d[es_balon], d[~es_balon].copy()
        revisar_estructura(S, d, jg)
        revisar_tiempo(S, d)
        revisar_atipicos(S, jg, bal)
        revisar_eventos(S, d, gid)
        revisar_contra_pff(S, jg, pf_juego[gid], p[p.gameId == gid][["playId", "possessionTeam", "defensiveTeam"]])
        S["jug"].append(jg.drop_duplicates("nflId")[["nflId", "team", "jerseyNumber"]].assign(gameId=gid))
        S["dirs"].append(d.drop_duplicates("playId")[["playId", "playDirection"]].assign(gameId=gid))
        S["tiempos"].append((gid, jg.time.min(), jg.time.max()))
        S["n"]["archivos"] += 1
    return S


def cerrar_tracking(S):
    """Convierte los acumuladores en métricas y en el perfil de columnas del tracking."""
    n, ext = S["n"], S["ext"]
    cuadros = pd.Series(S["cuadros"])
    jug = pd.concat(S["jug"], ignore_index=True)
    pj = jug.groupby("nflId")
    ext_todo = lambda c: [min(ext[f"jug.{c}"][0], ext[f"bal.{c}"][0]), max(ext[f"jug.{c}"][1], ext[f"bal.{c}"][1])]
    M["tracking"] = dict(
        archivos=n["archivos"], filas=n["filas"], filas_balon=n["balon"], cuadros=n["filas"] // 23,
        nulos={c: n["nulos_" + c] for c in ("nflId", "jerseyNumber", "o", "dir", "event", "x", "y", "s", "a", "dis")},
        event_None_texto=n["event_None_texto"],
        cuadros_por_jugada=dict(min=int(cuadros.min()), mediana=float(cuadros.median()), media=round(float(cuadros.mean()), 1), max=int(cuadros.max())),
        dependencias_violadas={k: n[k] for k in ("jugada_con_2_direcciones", "cuadro_con_2_eventos", "jugador_con_2_equipos_en_partido",
                                                 "jugador_con_2_dorsales_en_partido", "cuadros_con_2_marcas_time", "filas_time_distinto", "filas_time_distinto_balon")},
        forma={k: n[k] for k in ("filas_con_llave_duplicada", "filas_por_cuadro_distintas_de_23", "jugadas_sin_22_jugadores", "jugadas_con_cuadros_discontinuos")},
        atipicos={k: n[k] for k in ("jug_s_mayor_13", "jug_a_abs_mayor_15", "jug_dis_mayor_1_3", "jug_x_fuera", "jug_y_fuera", "bal_x_fuera", "bal_y_fuera", "bal_dis_mayor_3", "jug_o_dir_nulos")},
        extremos={k: [round(a, 2), round(b, 2)] for k, (a, b) in ext.items()},
        contra_pff=dict(pares=n["pares_jugada_jugador"], solo_en_uno=n["pares_jugada_jugador_solo_en_uno"], equipo_distinto_al_del_rol=n["pares_con_equipo_distinto_al_del_rol"]),
        jugador_partido=dict(pares=len(jug), por_partido=jug.groupby("gameId").size().agg(["min", "median", "max"]).to_dict(),
                             jugadores_con_2_equipos=int((pj.team.nunique() > 1).sum()), jugadores_con_2_dorsales=int((pj.jerseyNumber.nunique() > 1).sum())),
        eventos_cuadros_unicos=int(sum(S["ev_cuadros"].values())), eventos_por_nombre_cuadros=dict(S["ev_cuadros"]), eventos_por_nombre_jugadas=dict(S["ev_jugadas"]))
    for c in S["dtypes"]:
        lo, hi = (ext_todo(c) if c in ("x", "y", "s", "a", "dis") else ext.get(f"jug.{c}", [None, None]))
        nulos = n["nulos_" + c]
        PERFIL.append(dict(tabla="tracking (122 archivos)", columna=c, tipo=S["dtypes"][c], filas=n["filas"], nulos=nulos,
                           pct_nulos=round(100 * nulos / n["filas"], 2), unicos=None, minimo=lo, maximo=hi, ejemplo=None))


# ---------------------------------------------------------------- tablas pequeñas
def analizar_games_players(g, pl, S, p, f):
    M["llaves_duplicadas"] = dict(games=int(g.gameId.duplicated().sum()), players=int(pl.nflId.duplicated().sum()),
                                  plays=int(p.duplicated(["gameId", "playId"]).sum()), pffScoutingData=int(f.duplicated(["gameId", "playId", "nflId"]).sum()))
    por_equipo = pd.concat([g.homeTeamAbbr, g.visitorTeamAbbr]).value_counts()
    semana_equipo = pd.concat([g.assign(t=g.homeTeamAbbr), g.assign(t=g.visitorTeamAbbr)]).groupby(["t", "week"]).size()
    T = pd.DataFrame(S["tiempos"], columns=["gameId", "primera", "ultima"]).merge(g, on="gameId")
    utc = lambda x: pd.to_datetime(x.str.replace("Z", "", regex=False))            # marcas de tracking, UTC
    inicio = pd.to_datetime(T.gameDate + " " + T.gameTimeEastern, format="%m/%d/%Y %H:%M:%S") + pd.Timedelta(hours=4)  # EDT = UTC-4
    demora = (utc(T.primera) - inicio).dt.total_seconds() / 60
    duracion = (utc(T.ultima) - utc(T.primera)).dt.total_seconds() / 3600
    M["games"] = dict(filas=len(g), n_equipos=int(por_equipo.size), lista_equipos=sorted(por_equipo.index), equipos_con_7=int((por_equipo == 7).sum()),
                      equipos_con_8=int((por_equipo == 8).sum()), equipo_repetido_en_semana=int((semana_equipo > 1).sum()),
                      partidos_por_semana=g.groupby("week").size().to_dict(),
                      jugadas_por_partido=p.groupby("gameId").size().agg(["min", "median", "max"]).to_dict(),
                      posesion_de_M_Stafford=p[p.playDescription.str.contains("M.Stafford", regex=False)].possessionTeam.value_counts().to_dict(),
                      gameId_prefijo_igual_a_fecha=int((g.gameId.astype(str).str[:8] == pd.to_datetime(g.gameDate, format="%m/%d/%Y").dt.strftime("%Y%m%d")).sum()), ultima_fecha=g.gameDate.iloc[-1],
                      primera_marca_menos_inicio_min=demora.describe().round(1)[["min", "50%", "max"]].to_dict(),
                      marcas_duracion_horas=duracion.describe().round(2)[["min", "50%", "max"]].to_dict())
    bd, co, alto = pl.birthDate.isna(), pl.collegeName.isna(), pl.nflId > 53000
    pulg = pl.height.str.extract(r"^(\d)-(\d{1,2})$").astype(float)
    pulg = pulg[0] * 12 + pulg[1]
    rep = pl[pl.displayName.duplicated(keep=False)]
    M["players"] = dict(
        filas=len(pl), sin_birthDate=int(bd.sum()), sin_college=int(co.sum()), sin_ambos=int((bd & co).sum()),
        solo_sin_birthDate=int((bd & ~co).sum()), solo_sin_college=int((~bd & co).sum()),
        nflId_mayor_53000=int(alto.sum()), sin_birthDate_entre_ellos=int((bd & alto).sum()), sin_birthDate_entre_los_demas=int((bd & ~alto).sum()),
        altura_formato_ok=int(pl.height.str.match(r"^\d-\d{1,2}$").sum()), altura_pulg_min_max=[int(pulg.min()), int(pulg.max())],
        peso_min_max=[int(pl.weight.min()), int(pl.weight.max())],
        birth_iso=int(pl.birthDate.str.match(r"^\d{4}-\d{2}-\d{2}$", na=False).sum()), birth_mdy=int(pl.birthDate.str.match(r"^\d{2}/\d{2}/\d{4}$", na=False).sum()),
        nombres_repetidos=int(rep.displayName.nunique()), jugadores_con_nombre_repetido=len(rep),
        posiciones=pl.officialPosition.value_counts().to_dict())


def analizar_plays(p, S):
    t = p.playDescription
    sin_jugada, dos = t.str.contains("No Play", regex=False), t.str.contains("TWO-POINT", regex=False)
    raros = p[["absoluteYardlineNumber", "offenseFormation", "personnelO", "defendersInBox", "personnelD"]].isna().any(axis=1)
    db, pen = p.dropBackType.isna(), p.penaltyYards
    dif, delta = p.playResult != p.prePenaltyPlayResult, p.playResult - p.prePenaltyPlayResult
    M["plays"] = dict(
        filas=len(p), no_play=int(sin_jugada.sum()), no_play_con_penaltyYards=int((sin_jugada & pen.notna()).sum()),
        con_penaltyYards=int(pen.notna().sum()), penaltyYards_cero=int((pen == 0).sum()), penaltyYards_negativo=int((pen < 0).sum()), penaltyYards_positivo=int((pen > 0).sum()),
        con_foulName1=int(p.foulName1.notna().sum()), penalty_sin_foulName1=int((pen.notna() & p.foulName1.isna()).sum()),
        penalty_sin_foulName1_en_cero=int((pen.notna() & p.foulName1.isna() & (pen == 0)).sum()),
        penalty_sin_foulName1_negativo=int((pen.notna() & p.foulName1.isna() & (pen < 0)).sum()),
        faltas_registradas=[int(p[f"foulNFLId{i}"].notna().sum()) for i in (1, 2, 3)],
        nulos_raros=int(raros.sum()), nulos_raros_en_no_play=int((raros & sin_jugada).sum()),
        dropBack_nulo=int(db.sum()), dropBack_nulo_no_play=int((db & sin_jugada).sum()), dropBack_nulo_dos_puntos=int((db & dos).sum()),
        dropBack_nulo_otros=int((db & ~sin_jugada & ~dos).sum()),
        yardlineSide_nulo=int(p.yardlineSide.isna().sum()), yardlineSide_nulo_en_50=int((p.yardlineSide.isna() & (p.yardlineNumber == 50)).sum()),
        resultado_difiere=int(dif.sum()), difiere_con_penaltyYards=int((dif & pen.notna()).sum()), difiere_sin_penaltyYards=int((dif & pen.isna()).sum()),
        delta_igual_penaltyYards=int((dif & (delta == pen)).sum()),
        down0=int((p.down == 0).sum()), down0_dos_puntos=int(((p.down == 0) & dos).sum()),
        yardsToGo0=int((p.yardsToGo == 0).sum()), yardsToGo0_en_down0=int(((p.yardsToGo == 0) & (p.down == 0)).sum()),
        cuarto5=int((p.quarter == 5).sum()), partidos_con_cuarto5=int(p[p.quarter == 5].gameId.nunique()),
        no_play_playResult_igual_penaltyYards=int((sin_jugada & (p.playResult == pen)).sum()),
        entre_downs=int(t.str.contains("enforced between downs", regex=False).sum()),
        entre_downs_playResult_sin_sancion=int((t.str.contains("enforced between downs", regex=False) & (p.playResult == p.prePenaltyPlayResult)).sum()),
        textos_repetidos=int(t.duplicated().sum()), play_action_pff=int(p.pff_playAction.sum()),
        play_action_texto=int(t.str.contains("play action|play-action", case=False).sum()))
    q = p.copy()
    mm = q.gameClock.str.extract(r"^(\d{2}):(\d{2})$").astype(float)
    q["seg_cuarto"] = mm[0] * 60 + mm[1]
    q["seg_juego"] = np.where(q.quarter < 5, (q.quarter - 1) * 900 + 900 - q.seg_cuarto, 3600 + 600 - q.seg_cuarto)

    def bajadas(orden):
        gb = q.sort_values(["gameId"] + orden).groupby("gameId")
        return dict(reloj=int((gb.seg_juego.diff() < 0).sum()), marcador=int((gb.preSnapHomeScore.diff() < 0).sum() + (gb.preSnapVisitorScore.diff() < 0).sum()))
    en_texto = q.playDescription.str.extract(r"^\((\d*):(\d{2})\)")      # reloj entre paréntesis al inicio de la descripción
    con_reloj_en_texto = int(en_texto[0].notna().sum())
    seg_texto = en_texto[0].replace("", "0").astype(float) * 60 + en_texto[1].astype(float)
    igual_texto = int((seg_texto[en_texto[0].notna()] == q.seg_cuarto[en_texto[0].notna()]).sum())
    M["orden"] = dict(por_playId=bajadas(["playId"]), por_reloj_y_playId=bajadas(["seg_juego", "playId"]),
                      jugadas_con_mismo_segundo=int(q.duplicated(["gameId", "seg_juego"], keep=False).sum()),
                      gameClock_formato_ok=int(q.gameClock.str.match(r"^\d{2}:\d{2}$").sum()),
                      gameClock_igual_al_texto=[igual_texto, con_reloj_en_texto])
    return q


def analizar_complementos(q, g, f, pl, S):
    """Campos que se pueden derivar combinando tablas o leyendo la descripción."""
    t = q.playDescription
    # personal: 'OL' y 'QB' se omiten cuando valen 5 y 1
    cuenta = lambda s: {k: int(v) for v, k in re.findall(r"(\d+) ([A-Z]{2})", s)} if isinstance(s, str) else None
    so = q.personnelO.map(cuenta).dropna().map(lambda d: sum(d.values()) + (0 if "OL" in d else 5) + (0 if "QB" in d else 1))
    sd = q.personnelD.map(cuenta).dropna().map(lambda d: sum(d.values()))
    M["personal"] = dict(ofensivo_suma_11=int((so == 11).sum()), ofensivo_total=len(so), defensivo_suma_11=int((sd == 11).sum()), defensivo_total=len(sd),
                         etiqueta_QB=int(q.personnelO.fillna("").str.contains("QB").sum()), etiqueta_OL=int(q.personnelO.fillna("").str.contains("OL").sum()),
                         etiquetas_ofensivas=sorted({k for s in q.personnelO.map(cuenta).dropna() for k in s}), etiquetas_defensivas=sorted({k for s in q.personnelD.map(cuenta).dropna() for k in s}))
    # campo: yardas a la zona de anotación y su relación con absoluteYardlineNumber
    d = q.merge(pd.concat(S["dirs"]), on=["gameId", "playId"])
    propia = np.where(d.yardlineSide.isna(), 50, np.where(d.yardlineSide == d.possessionTeam, d.yardlineNumber, 100 - d.yardlineNumber))
    calc = np.where(d.playDirection == "right", 10 + propia, 110 - propia)
    ok = d.absoluteYardlineNumber.notna().to_numpy()
    zona20, cob_rz = (100 - propia) <= 20, d.pff_passCoverage.isin(["Red Zone", "Goal Line"]).to_numpy()
    M["campo"] = dict(comparables=int(ok.sum()), coinciden=int((calc[ok] == d.absoluteYardlineNumber.to_numpy()[ok]).sum()),
                      a_20_yardas_o_menos=int(zona20.sum()), cobertura_red_zone_o_goal_line=int(cob_rz.sum()), ambas=int((zona20 & cob_rz).sum()))
    # touchdown: texto con exclusión de jugadas anuladas, validado contra el marcador siguiente
    anula = t.str.contains("No Play|NULLIFIED|REVERSED", regex=True)
    q = q.assign(td=t.str.contains("TOUCHDOWN", regex=False) & ~anula)
    o = q.sort_values(["gameId", "seg_juego", "playId"]).merge(g[["gameId", "homeTeamAbbr"]], on="gameId")
    sig_l, sig_v = o.groupby("gameId").preSnapHomeScore.shift(-1), o.groupby("gameId").preSnapVisitorScore.shift(-1)
    local = o.possessionTeam == o.homeTeamAbbr
    sube_of = np.where(local, sig_l - o.preSnapHomeScore, sig_v - o.preSnapVisitorScore)
    sube_de = np.where(local, sig_v - o.preSnapVisitorScore, sig_l - o.preSnapHomeScore)
    of, de = o.td & (o.passResult != "IN") & ~np.isnan(sube_of), o.td & (o.passResult == "IN") & ~np.isnan(sube_de)
    M["touchdown"] = dict(texto_ingenuo=int(t.str.contains("TOUCHDOWN", regex=False).sum()), con_regla=int(q.td.sum()),
                          ofensivos_validables=int(of.sum()), ofensivos_suben_6_o_mas=int((of & (sube_of >= 6)).sum()),
                          intercepciones_validables=int(de.sum()), intercepciones_suben_6_o_mas=int((de & (sube_de >= 6)).sum()),
                          por_passResult=q[q.td].passResult.value_counts().to_dict())


def analizar_pases(q, f, pl):
    """Longitud, zona y receptor objetivo, leídos de la descripción y resueltos con el roster de la jugada."""
    lanz = q.passResult.isin(["C", "I", "IN"])
    lz = q.playDescription.str.extract(r"pass (?:incomplete )?(short|deep)?\s?(left|middle|right)?", flags=re.I)
    SUF = {"jr.", "sr.", "ii", "iii", "iv", "v"}

    def partes(nombre):
        t = [x for x in nombre.replace(",", "").split() if x.lower() not in SUF]
        return t[0], (" ".join(t[1:]) if len(t) > 1 else t[0])
    of = f[f.pff_role.isin(OFENSA)].merge(pl[["nflId", "displayName"]], on="nflId")
    of[["nombre", "apellido"]] = of.displayName.map(partes).tolist()
    cand = {k: list(zip(v.nflId, v.nombre, v.apellido, v.pff_role)) for k, v in of.groupby(["gameId", "playId"])}
    con_objetivo = lanz & q.playDescription.str.contains(r"(?:\bto|intended for) [A-Z][a-z]{0,2}\.[A-Z]")
    estados, sin_match = Counter(), Counter()
    for gid, pid, txt in zip(q.gameId[con_objetivo], q.playId[con_objetivo], q.playDescription[con_objetivo]):
        hits = []
        for nid, nom, ape, rol in cand.get((gid, pid), []):
            m = re.search(rf"(?:\bto|intended for) ({re.escape(nom[0])}[a-z]{{0,2}})\.{re.escape(ape)}(?![A-Za-z])", txt)
            if m and nom.replace('.', '').lower().startswith(m.group(1).lower()):    # 'Aa.' = Aaron, 'Am.' = Amari, 'Dj.' = D.J.
                hits.append(m.start())
        hits.sort()
        est = "sin_coincidencia" if not hits else "ambiguo" if len(hits) > 1 and hits[0] == hits[1] else "resuelto"
        if est == "sin_coincidencia":
            token = re.search(r"(?:\bto|intended for) ([A-Z][a-z]{0,2}\.[A-Z][A-Za-z'\-]*)", txt).group(1)
            sin_match[token] += 1
            mismos = [nid for nid, nom, ape, rol in cand.get((gid, pid), []) if rol == "Pass Route" and nom[0] == token[0]]
            est = "resuelto_por_inicial" if len(mismos) == 1 else est      # respaldo: único receptor con esa inicial
        estados[est] += 1
    M["pases"] = dict(lanzados=int(lanz.sum()), con_longitud=int(lz[0][lanz].notna().sum()), con_zona=int(lz[1][lanz].notna().sum()),
                      longitud=lz[0][lanz].str.lower().value_counts().to_dict(), con_objetivo_en_texto=int(con_objetivo.sum()),
                      sin_objetivo_en_texto=int((lanz & ~con_objetivo).sum()), objetivo=dict(estados), nombres_sin_coincidencia=dict(sin_match))


def analizar_pff(f, p, pl):
    cols = [c for c in f.columns if c.startswith("pff_") and c not in ("pff_role", "pff_positionLinedUp")]
    nn = f.groupby("pff_role")[cols].agg(lambda s: int(s.notna().sum()))
    nn.insert(0, "filas", f.groupby("pff_role").size())
    nn.to_csv(SALIDA / "nulos_pff_por_rol.csv")
    pres = f[["pff_hit", "pff_hurry", "pff_sack"]].fillna(0).sum(axis=1) > 0
    jug = f.assign(presion=pres.astype(int)).groupby(["gameId", "playId"]).agg(
        sack=("pff_sack", "sum"), permitido=("pff_sackAllowed", "sum"), presion=("presion", "sum")).reset_index()
    m = p[["gameId", "playId", "passResult"]].merge(jug, on=["gameId", "playId"])
    S = m.passResult == "S"
    c = f.pivot_table(index=["gameId", "playId"], columns="pff_role", values="nflId", aggfunc="count", fill_value=0)
    pas = f[f.pff_role == "Pass"].merge(pl[["nflId", "officialPosition"]], on="nflId")
    bloq = f[f.pff_nflIdBlockedPlayer.notna()][["gameId", "playId", "nflId", "pff_nflIdBlockedPlayer"]]
    bloq = bloq.assign(objetivo=bloq.pff_nflIdBlockedPlayer.astype(int)).merge(
        f[["gameId", "playId", "nflId", "pff_role"]].rename(columns={"nflId": "objetivo", "pff_role": "rol_bloqueado"}), on=["gameId", "playId", "objetivo"], how="left")
    M["pff"] = dict(
        filas=len(f), roles=f.pff_role.value_counts().to_dict(), posiciones_distintas=int(f.pff_positionLinedUp.nunique()), tipos_de_bloqueo=int(f.pff_blockType.nunique()),
        jugadas_11_ofensa_y_11_defensa=int(((c[OFENSA].sum(axis=1) == 11) & (c[["Pass Rush", "Coverage"]].sum(axis=1) == 11)).sum()),
        bloqueadores_por_jugada=c["Pass Block"].value_counts().sort_index().to_dict(), rushers_por_jugada=c["Pass Rush"].value_counts().sort_index().to_dict(),
        pass_route_con_bloqueo=int(((f.pff_role == "Pass Route") & f.pff_blockType.notna()).sum()),
        pass_block_sin_tipo=int(((f.pff_role == "Pass Block") & f.pff_blockType.isna()).sum()),
        pass_block_sin_bloqueado=int(((f.pff_role == "Pass Block") & f.pff_nflIdBlockedPlayer.isna()).sum()),
        coverage_con_presion=int(((f.pff_role == "Coverage") & pres).sum()),
        bloqueos_con_objetivo=len(bloq), objetivo_en_la_jugada=int(bloq.rol_bloqueado.notna().sum()), rol_del_bloqueado=bloq.rol_bloqueado.value_counts().to_dict(),
        sacks_passResult=int(S.sum()), sacks_con_pff_sack=int((S & (m.sack > 0)).sum()), sacks_con_sackAllowed=int((S & (m.permitido > 0)).sum()),
        pff_sack_fuera_de_S=int((~S & (m.sack > 0)).sum()), sacks_compartidos=int((m.sack > 1).sum()),
        jugadas_con_presion=int((m.presion > 0).sum()), pct_jugadas_con_presion=round(100 * (m.presion > 0).mean(), 1),
        pasador_no_QB=int((pas.officialPosition != "QB").sum()))
    x = f.merge(pl[["nflId", "officialPosition"]], on="nflId").groupby("pff_positionLinedUp")
    dom = lambda s: s.value_counts().index[0]
    pct = lambda s: round(100 * s.value_counts(normalize=True).iloc[0], 1)
    cat = pd.DataFrame(dict(filas=x.size(), pos_oficial_dominante=x.officialPosition.agg(dom), pct_pos_oficial=x.officialPosition.agg(pct),
                            rol_principal=x.pff_role.agg(dom), pct_rol=x.pff_role.agg(pct), roles_distintos=x.pff_role.nunique())).sort_values("filas", ascending=False)
    cat.to_csv(SALIDA / "catalogo_posiciones_pff.csv")
    M["pff"]["posiciones_con_rol_unico"] = int((cat.roles_distintos == 1).sum())


# ---------------------------------------------------------------- relaciones entre tablas
def verificar_relaciones(g, pl, p, f, S):
    ids, llaves = set(pl.nflId), set(zip(p.gameId, p.playId))
    n = S["n"]
    en_juego = p.merge(g, on="gameId")
    rel("R01", "plays", "gameId", "games", "gameId", "N:1", len(p), (~p.gameId.isin(g.gameId)).sum(), "122 partidos, unas 70 jugadas cada uno")
    rel("R02", "pffScoutingData", "gameId+playId", "plays", "gameId+playId", "N:1", len(f), sum(k not in llaves for k in zip(f.gameId, f.playId)), "22 filas por jugada")
    rel("R03", "pffScoutingData", "nflId", "players", "nflId", "N:1", len(f), (~f.nflId.isin(ids)).sum())
    ob = f.pff_nflIdBlockedPlayer.dropna().astype(int)
    rel("R04", "pffScoutingData", "pff_nflIdBlockedPlayer", "players", "nflId", "N:1", len(ob), (~ob.isin(ids)).sum(), "solo filas con bloqueo")
    rel("R05", "pffScoutingData", "pff_nflIdBlockedPlayer", "pffScoutingData (misma jugada)", "nflId", "N:1", M["pff"]["bloqueos_con_objetivo"],
        M["pff"]["bloqueos_con_objetivo"] - M["pff"]["objetivo_en_la_jugada"], "el bloqueado casi siempre es un defensor de la misma jugada")
    fl = pd.concat([p[["gameId", "playId", f"foulName{i}", f"foulNFLId{i}"]].set_axis(["gameId", "playId", "falta", "nflId"], axis=1) for i in (1, 2, 3)]).dropna(subset=["nflId"])
    fl["nflId"] = fl.nflId.astype(int)
    rel("R06", "plays", "foulNFLId1..3", "players", "nflId", "N:1", len(fl), (~fl.nflId.isin(ids)).sum(), "una fila por falta con jugador")
    fl = fl.merge(f[["gameId", "playId", "nflId", "pff_role"]], on=["gameId", "playId", "nflId"], how="left")
    rel("R07", "plays", "foulNFLId1..3", "pffScoutingData (misma jugada)", "nflId", "N:1", len(fl), fl.pff_role.isna().sum(), "el infractor suele estar entre los 22 en campo")
    lado = fl.pff_role.map(lambda r: None if pd.isna(r) else "ofensa" if r in OFENSA else "defensa")
    for pref, esp in (("Offensive", "ofensa"), ("Defensive", "defensa")):
        sel = fl.falta.str.startswith(pref, na=False) & lado.notna()
        M.setdefault("faltas", {})[pref] = dict(con_jugador_en_campo=int(sel.sum()), lado_coincide=int((lado[sel] == esp).sum()))
    M["faltas"]["total"], M["faltas"]["fuera_de_la_jugada"] = len(fl), int(fl.pff_role.isna().sum())
    sg = p[p.foulNFLId1.notna() & p.penaltyYards.notna() & (p.penaltyYards != 0)][["gameId", "playId", "foulNFLId1", "penaltyYards"]]
    sg = sg.assign(nflId=sg.foulNFLId1.astype(int)).merge(f[["gameId", "playId", "nflId", "pff_role"]], on=["gameId", "playId", "nflId"])
    ofensa = sg.pff_role.isin(OFENSA)
    M["faltas"]["signo_penaltyYards"] = dict(con_infractor_en_campo=len(sg), negativo_y_ofensa=int((ofensa & (sg.penaltyYards < 0)).sum()),
                                             positivo_y_defensa=int((~ofensa & (sg.penaltyYards > 0)).sum()))
    rel("R08", "tracking", "gameId (archivo)", "games", "gameId", "N:1", n["archivos"], len(set(map(int, pd.concat(S["dirs"]).gameId)) - set(g.gameId)), "un archivo por partido")
    td = pd.concat(S["dirs"])
    rel("R09", "tracking", "gameId+playId", "plays", "gameId+playId", "N:1", len(td), sum(k not in llaves for k in zip(td.gameId, td.playId)), "todas las jugadas de plays tienen tracking")
    rel("R10", "tracking", "nflId", "players", "nflId", "N:1", len(pd.concat(S["jug"])), (~pd.concat(S["jug"]).nflId.astype(int).isin(ids)).sum(), "jugadores únicos por partido")
    for col, nom in (("possessionTeam", "R11"), ("defensiveTeam", "R12")):
        rel(nom, "plays", col, "games", "homeTeamAbbr o visitorTeamAbbr", "N:1", len(en_juego), (~((en_juego[col] == en_juego.homeTeamAbbr) | (en_juego[col] == en_juego.visitorTeamAbbr))).sum())
    c = M["tracking"]["contra_pff"]
    rel("R13", "tracking (jugador por jugada)", "gameId+playId+nflId", "pffScoutingData", "gameId+playId+nflId", "1:1", c["pares"] + c["solo_en_uno"], c["solo_en_uno"], "los 22 de tracking son los 22 de PFF")
    rel("R14", "tracking (jugador por jugada)", "team", "plays", "possessionTeam o defensiveTeam según pff_role", "N:1", c["pares"], c["equipo_distinto_al_del_rol"], "rol ofensivo = equipo en posesión")


# ---------------------------------------------------------------- eventos, rendimiento y salida
def analizar_eventos(S, p):
    """Compara eventos manuales y automáticos y mide el efecto en el tiempo al lanzamiento."""
    F = pd.concat(S["frames"], ignore_index=True)
    for c in ("ball_snap", "autoevent_ballsnap", "pass_forward", "autoevent_passforward"):
        if c not in F:
            F[c] = np.nan
    for c in ("play_action", "qb_sack", "qb_strip_sack"):
        if c not in F:
            F[c] = np.nan
    F = F.merge(p[["gameId", "playId", "passResult", "pff_playAction"]], on=["gameId", "playId"])
    snap_min, pase_min = F[["ball_snap", "autoevent_ballsnap"]].min(axis=1), F[["pass_forward", "autoevent_passforward"]].min(axis=1)
    snap_pref, pase_pref = F.ball_snap.fillna(F.autoevent_ballsnap), F.pass_forward.fillna(F.autoevent_passforward)
    t_min, t_pref, t_man = (pase_min - snap_min) / 10, (pase_pref - snap_pref) / 10, (F.pass_forward - F.ball_snap) / 10
    desc = lambda s: s.dropna().describe(percentiles=[.1, .5, .9]).round(2)[["count", "mean", "10%", "50%", "90%", "max"]].to_dict()
    dif = (t_min - t_pref).abs().dropna()
    hay_sack = F.qb_sack.notna() | F.qb_strip_sack.notna()
    par = lambda a, b: (lambda d: dict(n=len(d), iguales=int((d == 0).sum()), mediana=float(d.median()), min=float(d.min()), max=float(d.max())))((F[a] - F[b]).dropna())
    M["eventos"] = dict(
        jugadas=len(F), snap_manual=int(F.ball_snap.notna().sum()), snap_auto=int(F.autoevent_ballsnap.notna().sum()), snap_alguno=int(snap_pref.notna().sum()),
        pase_manual=int(F.pass_forward.notna().sum()), pase_auto=int(F.autoevent_passforward.notna().sum()), pase_alguno=int(pase_pref.notna().sum()),
        pase_solo_auto=int((F.pass_forward.isna() & F.autoevent_passforward.notna()).sum()),
        auto_menos_manual_snap=par("autoevent_ballsnap", "ball_snap"), auto_menos_manual_pase=par("autoevent_passforward", "pass_forward"),
        tiempo_al_lanzamiento=dict(el_menor_de_ambos=desc(t_min), manual_con_respaldo_auto=desc(t_pref), solo_manual=desc(t_man),
                                   politicas_distintas=int((dif > 0).sum()), difieren_medio_segundo_o_mas=int((dif >= 0.5).sum()), mayor_diferencia_s=round(float(dif.max()), 1)),
        play_action_cruce=dict(ambos=int((F.pff_playAction.eq(1) & F.play_action.notna()).sum()), solo_pff=int((F.pff_playAction.eq(1) & F.play_action.isna()).sum()),
                               solo_evento=int((F.pff_playAction.eq(0) & F.play_action.notna()).sum())),
        qb_sack_cruce=dict(sacks=int((F.passResult == "S").sum()), con_evento=int(((F.passResult == "S") & hay_sack).sum()), evento_fuera_de_S=int(((F.passResult != "S") & hay_sack).sum())),
        pase_por_resultado={r: [int(pase_pref[F.passResult == r].notna().sum()), int((F.passResult == r).sum())] for r in F.passResult.unique()})


def medir_rendimiento(g, pl, p, f):
    """Mide memoria y tiempo de carga de un partido de tamaño mediano, con y sin tipos ajustados."""
    archivos = sorted(glob.glob(str(DATA / "tracking" / "*.csv")), key=lambda x: Path(x).stat().st_size)
    fn = archivos[len(archivos) // 2]
    t0 = time.perf_counter()
    a = pd.read_csv(fn)
    t_a = time.perf_counter() - t0
    tipos = {"gameId": "int32", "playId": "uint16", "frameId": "uint8", "team": "category", "playDirection": "category", "event": "category",
             "nflId": "float32", "jerseyNumber": "float32", **{c: "float32" for c in ("x", "y", "s", "a", "dis", "o", "dir")}}
    t0 = time.perf_counter()
    b = pd.read_csv(fn, na_values=["NA"], keep_default_na=False, usecols=lambda c: c != "time", dtype=tipos)
    t_b = time.perf_counter() - t0
    mb = lambda d: d.memory_usage(deep=True).sum() / 1e6
    total = M["tracking"]["filas"]
    M["rendimiento"] = dict(
        archivo=Path(fn).name, filas=len(a), lectura_s_defecto=round(t_a, 2), mb_defecto=round(mb(a), 1), lectura_s_optimizada=round(t_b, 2), mb_optimizada=round(mb(b), 1),
        bytes_fila_defecto=round(mb(a) * 1e6 / len(a), 1), bytes_fila_optimizada=round(mb(b) * 1e6 / len(b), 1),
        total_mb_defecto=round(mb(a) * total / len(a)), total_mb_optimizada=round(mb(b) * total / len(b)),
        tablas_pequenas_mb=dict(games=round(mb(g), 2), players=round(mb(pl), 2), plays=round(mb(p), 1), pffScoutingData=round(mb(f), 1)))


def verificar_unidades():
    """Comprueba la frecuencia de muestreo y la convención de ángulos con un archivo de tamaño mediano."""
    archivos = sorted(glob.glob(str(DATA / "tracking" / "*.csv")), key=lambda x: Path(x).stat().st_size)
    d = pd.read_csv(archivos[len(archivos) // 2], usecols=["playId", "nflId", "frameId", "team", "x", "y", "s", "dis", "dir"])
    j = d[d.team != "football"].sort_values(["playId", "nflId", "frameId"])
    g = j.groupby(["playId", "nflId"])
    j = j.assign(dx=g.x.shift(-1) - j.x, dy=g.y.shift(-1) - j.y)
    mueve = j[(j.s > 3) & j.dx.notna()]
    err = lambda a, b: np.abs((a - b + 180) % 360 - 180)
    rapido = j[j.s > 2]
    M["unidades"] = dict(
        cociente_dis_sobre_s_por_0_1=round(float((rapido.dis / (rapido.s * 0.1)).median()), 3),
        error_mediano_grados_0_en_y_horario=round(float(np.median(err(mueve.dir, np.degrees(np.arctan2(mueve.dx, mueve.dy)) % 360))), 1),
        error_mediano_grados_0_en_x_antihorario=round(float(np.median(err(mueve.dir, np.degrees(np.arctan2(mueve.dy, mueve.dx)) % 360))), 1))


def guardar():
    pd.DataFrame(PERFIL).to_csv(SALIDA / "perfil_columnas.csv", index=False)
    pd.DataFrame(REL).to_csv(SALIDA / "relaciones_verificadas.csv", index=False)
    (SALIDA / "metricas.json").write_text(json.dumps(limpiar(M), ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    SALIDA.mkdir(parents=True, exist_ok=True)
    g, pl, p, f = cargar()
    for nombre, df in (("games", g), ("players", pl), ("plays", p), ("pffScoutingData", f)):
        perfil(nombre, df)
    t0 = time.perf_counter()
    S = pasada_tracking(p, f)
    print(f"tracking leído en {time.perf_counter() - t0:.0f} s ({S['n']['archivos']} archivos)")
    cerrar_tracking(S)
    analizar_games_players(g, pl, S, p, f)
    q = analizar_plays(p, S)
    analizar_complementos(q, g, f, pl, S)
    analizar_pases(q, f, pl)
    analizar_pff(f, p, pl)
    analizar_eventos(S, p)
    verificar_relaciones(g, pl, p, f, S)
    medir_rendimiento(g, pl, p, f)
    verificar_unidades()
    guardar()
    print("listo:", ", ".join(sorted(x.name for x in SALIDA.iterdir())))


if __name__ == "__main__":
    main()
