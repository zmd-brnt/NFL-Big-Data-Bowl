#!/usr/bin/env python3
"""Limpia data/ siguiendo docs/RelacionesYLimpieza.md.

Lee SIEMPRE del respaldo ../data_original y escribe en data/ (se puede repetir sin degradar nada).
Uso, desde la raíz del proyecto:  .venv/bin/python docs/scripts/limpiar_data.py
"""
import re
import shutil
from pathlib import Path

import numpy as np
import pandas as pd

RAIZ = Path(__file__).resolve().parents[2]
DATA, ORIGEN = RAIZ / "data", RAIZ.parent / "data_original"
TMP = RAIZ.parent / "data_limpio_tmp"
OFENSA = ["Pass", "Pass Block", "Pass Route"]

EQUIPOS = """ARI Arizona Cardinals|NFC|Oeste;ATL Atlanta Falcons|NFC|Sur;BAL Baltimore Ravens|AFC|Norte;BUF Buffalo Bills|AFC|Este;
CAR Carolina Panthers|NFC|Sur;CHI Chicago Bears|NFC|Norte;CIN Cincinnati Bengals|AFC|Norte;CLE Cleveland Browns|AFC|Norte;
DAL Dallas Cowboys|NFC|Este;DEN Denver Broncos|AFC|Oeste;DET Detroit Lions|NFC|Norte;GB Green Bay Packers|NFC|Norte;
HOU Houston Texans|AFC|Sur;IND Indianapolis Colts|AFC|Sur;JAX Jacksonville Jaguars|AFC|Sur;KC Kansas City Chiefs|AFC|Oeste;
LA Los Angeles Rams|NFC|Oeste;LAC Los Angeles Chargers|AFC|Oeste;LV Las Vegas Raiders|AFC|Oeste;MIA Miami Dolphins|AFC|Este;
MIN Minnesota Vikings|NFC|Norte;NE New England Patriots|AFC|Este;NO New Orleans Saints|NFC|Sur;NYG New York Giants|NFC|Este;
NYJ New York Jets|AFC|Este;PHI Philadelphia Eagles|NFC|Este;PIT Pittsburgh Steelers|AFC|Norte;SEA Seattle Seahawks|NFC|Oeste;
SF San Francisco 49ers|NFC|Oeste;TB Tampa Bay Buccaneers|NFC|Sur;TEN Tennessee Titans|AFC|Sur;WAS Washington Football Team|NFC|Este"""
GRUPO = {"QB": "QB", "RB": "RB", "FB": "RB", "WR": "WR", "TE": "TE", "T": "OL", "G": "OL", "C": "OL", "DE": "DL", "DT": "DL", "NT": "DL",
         "OLB": "LB", "ILB": "LB", "MLB": "LB", "LB": "LB", "CB": "DB", "FS": "DB", "SS": "DB", "DB": "DB"}


def leer(nombre, **kw):
    return pd.read_csv(ORIGEN / nombre, **kw)          # 'NA' se lee como nulo


def guardar(df, nombre):
    df.to_csv(TMP / nombre, index=False, na_rep="")    # nulo = celda vacía


# ------------------------------------------------------------------ tracking (una pasada)
def limpiar_tracking(roster):
    (TMP / "tracking").mkdir(parents=True)
    jug, ev, dirs = [], [], []
    for fn in sorted((ORIGEN / "tracking").glob("tracking_*.csv")):
        t = pd.read_csv(fn, na_values=["NA", "None"], keep_default_na=False)   # event 'None' = sin evento
        gid = int(t.gameId.iloc[0])
        # la marca 'time' del balón difiere en 15 cuadros: se toma la de los jugadores
        ball = t.team.eq("football")
        malo = ball & t.groupby(["playId", "frameId"]).time.transform("nunique").gt(1)
        if malo.any():
            pt = t[~ball].drop_duplicates(["playId", "frameId"]).set_index(["playId", "frameId"]).time
            t.loc[malo, "time"] = pt.reindex(pd.MultiIndex.from_frame(t.loc[malo, ["playId", "frameId"]])).to_numpy()
        j = t[t.team != "football"]
        jug.append(j.drop_duplicates("nflId")[["gameId", "nflId", "team", "jerseyNumber"]].astype({"nflId": "int32", "jerseyNumber": "int32"}))
        e = t.dropna(subset=["event"])[["gameId", "playId", "frameId", "event"]].drop_duplicates()
        ev.append(e)
        dirs.append(t.drop_duplicates("playId")[["gameId", "playId", "playDirection"]])
        izq = t.playDirection.eq("left")                      # ataque siempre hacia X creciente
        t.loc[izq, "x"] = 120 - t.loc[izq, "x"]
        t.loc[izq, "y"] = 53.3 - t.loc[izq, "y"]
        for c in ("o", "dir"):
            t.loc[izq, c] = (t.loc[izq, c] + 180) % 360
        t[["x", "y", "o", "dir"]] = t[["x", "y", "o", "dir"]].round(2)
        t["nflId"], t["jerseyNumber"] = t.nflId.astype("Int64"), t.jerseyNumber.astype("Int64")
        t = t.sort_values(["playId", "frameId", "nflId"], na_position="last")
        guardar(t, f"tracking/{fn.name}")
    game_players = pd.concat(jug, ignore_index=True)
    play_events = pd.concat(ev, ignore_index=True)
    play_events["esAuto"] = play_events.event.str.startswith("autoevent_").astype(int)
    f = play_events.pivot_table(index=["gameId", "playId"], columns="event", values="frameId", aggfunc="min")
    snap, pase = f["ball_snap"].fillna(f["autoevent_ballsnap"]), f["pass_forward"].fillna(f["autoevent_passforward"])
    tiempo = ((pase - snap) / 10).dropna().rename("tiempoAlLanzamiento").reset_index()
    return game_players, play_events, tiempo, pd.concat(dirs, ignore_index=True)


# ------------------------------------------------------------------ tablas pequeñas
def limpiar_games():
    g = leer("games.csv")
    g["kickoffEastern"] = pd.to_datetime(g.gameDate + " " + g.gameTimeEastern, format="%m/%d/%Y %H:%M:%S").dt.strftime("%Y-%m-%dT%H:%M:%S")
    g["gameDate"] = pd.to_datetime(g.gameDate, format="%m/%d/%Y").dt.strftime("%Y-%m-%d")
    return g


def limpiar_players():
    pl = leer("players.csv")
    h = pl.height.str.extract(r"^(\d)-(\d{1,2})$").astype(int)
    pl["heightInches"] = h[0] * 12 + h[1]
    iso = pd.to_datetime(pl.birthDate, format="%Y-%m-%d", errors="coerce")
    pl["birthDate"] = iso.fillna(pd.to_datetime(pl.birthDate, format="%m/%d/%Y", errors="coerce")).dt.strftime("%Y-%m-%d")
    pl["positionGroup"] = pl.officialPosition.map(GRUPO)
    rep = pl.displayName.duplicated(keep=False)
    pl["nameLabel"] = np.where(rep, pl.displayName + " (" + pl.officialPosition + ")", pl.displayName)
    return pl


def resolver_receptor(q, f, pl):
    """nflId del receptor objetivo, leído del texto y resuelto con el roster ofensivo de cada jugada."""
    suf = {"jr.", "sr.", "ii", "iii", "iv", "v"}
    def partes(n):
        t = [x for x in n.replace(",", "").split() if x.lower() not in suf]
        return t[0], (" ".join(t[1:]) if len(t) > 1 else t[0])
    of = f[f.pff_role.isin(OFENSA)].merge(pl[["nflId", "displayName"]], on="nflId")
    of[["nom", "ape"]] = of.displayName.map(partes).tolist()
    cand = {k: list(zip(v.nflId, v.nom, v.ape, v.pff_role)) for k, v in of.groupby(["gameId", "playId"])}
    pat = re.compile(r"(?:\bto|intended for) ([A-Z][a-z]{0,2}\.[A-Z][A-Za-z'\-]*)")
    out = []
    for gid, pid, txt, lanz in zip(q.gameId, q.playId, q.playDescription, q.passResult.isin(["C", "I", "IN"])):
        m = pat.search(txt) if lanz else None
        if not m:
            out.append(None); continue
        hits = []
        for nid, nom, ape, rol in cand.get((gid, pid), []):
            mm = re.search(rf"(?:\bto|intended for) ({re.escape(nom[0])}[a-z]{{0,2}})\.{re.escape(ape)}(?![A-Za-z])", txt)
            if mm and nom.replace(".", "").lower().startswith(mm.group(1).lower()):
                hits.append((mm.start(), nid))
        hits.sort()
        if hits and not (len(hits) > 1 and hits[0][0] == hits[1][0]):
            out.append(hits[0][1]); continue
        ini = [nid for nid, nom, ape, rol in cand.get((gid, pid), []) if rol == "Pass Route" and nom[0] == m.group(1)[0]]
        out.append(ini[0] if not hits and len(ini) == 1 else None)      # respaldo: único receptor con esa inicial
    return pd.array(out, dtype="Int64")


def limpiar_plays(g, pl, f, tiempo, dirs):
    p = leer("plays.csv")
    t = p.playDescription
    p = p.merge(dirs, on=["gameId", "playId"], how="left").merge(g[["gameId", "homeTeamAbbr"]], on="gameId")
    p["passResultTexto"] = p.passResult.map({"C": "Completo", "I": "Incompleto", "S": "Sack", "R": "Scramble", "IN": "Intercepción"})
    p["esNoPlay"] = t.str.contains("No Play", regex=False).astype(int)
    p["esDosPuntos"] = p.down.eq(0).astype(int)
    p["hayPenalizacion"] = p.penaltyYards.notna().astype(int)
    p["ladoSancionado"] = np.sign(p.penaltyYards).map({-1.0: "ofensa", 1.0: "defensa"})
    nom = t.str.extract(r"[Pp][Ee][Nn][Aa][Ll][Tt][Yy] on [A-Z]{2,3}(?:-[^,]+)?, ([^,]+),")[0].str.strip()
    p["foulName1"] = p.foulName1.fillna(nom.where(p.penaltyYards.notna()))
    mm = p.gameClock.str.extract(r"^(\d{2}):(\d{2})$").astype(int)
    seg = mm[0] * 60 + mm[1]
    p["segJuego"] = np.where(p.quarter < 5, (p.quarter - 1) * 900 + 900 - seg, 3600 + 600 - seg)
    p["esTouchdown"] = (t.str.contains("TOUCHDOWN", regex=False) & ~t.str.contains("No Play|NULLIFIED|REVERSED")).astype(int)
    propia = np.where(p.yardlineSide.isna(), 50, np.where(p.yardlineSide == p.possessionTeam, p.yardlineNumber, 100 - p.yardlineNumber))
    p["yardasAZona"] = 100 - propia
    p["absoluteYardlineNumber"] = np.where(p.playDirection.eq("right"), 10 + propia, 110 - propia)
    p["lineaX"] = np.where(p.playDirection.eq("right"), p.absoluteYardlineNumber, 120 - p.absoluteYardlineNumber)   # línea de scrimmage con el ataque hacia la derecha
    local = p.possessionTeam == p.homeTeamAbbr
    p["difMarcador"] = np.where(local, p.preSnapHomeScore - p.preSnapVisitorScore, p.preSnapVisitorScore - p.preSnapHomeScore)
    for col, serie, of in (("O", p.personnelO, True), ("D", p.personnelD, False)):
        cuentas = serie.map(lambda s: {k: int(v) for v, k in re.findall(r"(\d+) ([A-Z]{2})", s)} if isinstance(s, str) else {})
        c = pd.DataFrame(cuentas.tolist(), index=p.index).fillna(0).astype(int)
        if of:                                                  # OL y QB se omiten cuando valen 5 y 1
            c["OL"] = c["OL"].replace(0, 5) if "OL" in c else 5
            c["QB"] = c["QB"].replace(0, 1) if "QB" in c else 1
        for k in c.columns:
            p[f"pers{col}_{k}"] = c[k].where(serie.notna()).astype("Int64")
    lz = t.str.extract(r"pass (?:incomplete )?(short|deep)?\s?(left|middle|right)?", flags=re.I)
    lanz = p.passResult.isin(["C", "I", "IN"])
    p["longitudPase"], p["zonaPase"] = lz[0].str.lower().where(lanz), lz[1].str.lower().where(lanz)
    qb = f[f.pff_role == "Pass"][["gameId", "playId", "nflId"]].rename(columns={"nflId": "qbId"})
    p = p.merge(qb, on=["gameId", "playId"], how="left").merge(tiempo, on=["gameId", "playId"], how="left")
    p["receptorId"] = resolver_receptor(p, f, pl)
    p = p.sort_values(["gameId", "segJuego", "playId"], ignore_index=True)
    p["orden"] = p.groupby("gameId").cumcount() + 1
    enteros = ["penaltyYards", "foulNFLId1", "foulNFLId2", "foulNFLId3", "defendersInBox", "absoluteYardlineNumber"]
    p[enteros] = p[enteros].astype("Int64")
    return p.drop(columns=["homeTeamAbbr"])


def limpiar_pff(p):
    f = leer("pffScoutingData.csv")
    marcas = [c for c in f.columns if c.startswith("pff_") and f[c].dtype == float and c != "pff_nflIdBlockedPlayer"] + ["pff_nflIdBlockedPlayer"]
    f[marcas] = f[marcas].astype("Int64")
    f["lado"] = np.where(f.pff_role.isin(OFENSA), "ofensa", "defensa")
    eq = p[["gameId", "playId", "possessionTeam", "defensiveTeam"]]
    f = f.merge(eq, on=["gameId", "playId"], how="left")
    f["team"] = np.where(f.lado == "ofensa", f.possessionTeam, f.defensiveTeam)
    return f.drop(columns=["possessionTeam", "defensiveTeam"])


def faltas_largas(p, f):
    partes = [p[["gameId", "playId", f"foulName{i}", f"foulNFLId{i}"]].set_axis(["gameId", "playId", "falta", "nflId"], axis=1).assign(orden=i) for i in (1, 2, 3)]
    fl = pd.concat(partes).dropna(subset=["falta"])
    fl = fl.merge(f[["gameId", "playId", "nflId", "lado"]].astype({"nflId": "Int64"}), on=["gameId", "playId", "nflId"], how="left")
    return fl.rename(columns={"lado": "ladoInfractor"}).sort_values(["gameId", "playId", "orden"], ignore_index=True)


def catalogo_equipos():
    filas = []
    for item in EQUIPOS.replace("\n", "").split(";"):
        a, conf, div = item.split("|")
        sigla, nombre = a.split(" ", 1)
        filas.append((sigla.strip(), nombre.strip(), conf, div))
    return pd.DataFrame(filas, columns=["team", "nombre", "conferencia", "division"])


# ------------------------------------------------------------------ validación y reemplazo
def validar(p, f, g, pl, fl, gp, ev):
    orig_p, orig_f = leer("plays.csv"), leer("pffScoutingData.csv")
    assert len(p) == len(orig_p) == 8557 and not p.duplicated(["gameId", "playId"]).any()
    assert len(f) == len(orig_f) == 188254 and not f.duplicated(["gameId", "playId", "nflId"]).any()
    assert len(g) == 122 and len(pl) == 1679 and len(gp) == 8901
    assert p.esNoPlay.sum() == 489 and p.esTouchdown.sum() == 380 and p.hayPenalizacion.sum() == 756
    gb = p.groupby("gameId")
    assert (gb.segJuego.diff() < 0).sum() == 0 and (gb.preSnapHomeScore.diff() < 0).sum() == 0 and (gb.preSnapVisitorScore.diff() < 0).sum() == 0
    ok = orig_p.set_index(["gameId", "playId"]).absoluteYardlineNumber.dropna()
    assert (p.set_index(["gameId", "playId"]).absoluteYardlineNumber.loc[ok.index] == ok).all(), "absoluteYardlineNumber distinto del original"
    assert p.foulName1.notna().sum() == 756 and len(fl) == 787
    assert p.qbId.notna().all() and p.tiempoAlLanzamiento.notna().sum() == 7583
    assert p.receptorId.notna().sum() >= 7300, p.receptorId.notna().sum()
    assert f.team.notna().all() and set(f.lado) == {"ofensa", "defensa"}
    assert len(ev) == 27862
    for c in ("persO_RB", "persO_OL", "persD_DL"):
        assert p[c].notna().sum() == 8556
    print("validaciones previas OK")


def reemplazar():
    n = 0
    for src in sorted(TMP.rglob("*")):
        if src.is_file():
            dst = DATA / src.relative_to(TMP)
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, dst); n += 1
    shutil.rmtree(TMP)
    print("archivos escritos en data/:", n)


def main():
    assert ORIGEN.exists(), f"falta el respaldo {ORIGEN}"
    if TMP.exists():
        shutil.rmtree(TMP)
    TMP.mkdir()
    g, pl = limpiar_games(), limpiar_players()
    gp, ev, tiempo, dirs = limpiar_tracking(None)
    print("tracking limpio")
    f0 = leer("pffScoutingData.csv")
    p = limpiar_plays(g, pl, f0, tiempo, dirs)
    f = limpiar_pff(p)
    fl = faltas_largas(p, f)
    validar(p, f, g, pl, fl, gp, ev)
    guardar(g, "games.csv"); guardar(pl, "players.csv"); guardar(p, "plays.csv"); guardar(f, "pffScoutingData.csv")
    guardar(fl, "play_fouls.csv"); guardar(gp.sort_values(["gameId", "nflId"]), "game_players.csv")
    guardar(ev.sort_values(["gameId", "playId", "frameId", "event"]), "play_events.csv"); guardar(catalogo_equipos(), "teams.csv")
    reemplazar()


if __name__ == "__main__":
    main()
