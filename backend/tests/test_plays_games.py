"""Contrato de /health, /api/plays y /api/games."""
import pytest

INTENTOS = ["C", "I", "IN"]


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


# ---------- /api/plays ----------
def test_plays_excluye_anuladas_y_dos_puntos(client):
    # 8,557 jugadas - 489 anuladas - 35 de 2 puntos + 1 que es ambas = 8,034 (cuenta a mano).
    r = client.get("api/plays")
    assert r.status_code == 200
    assert len(r.json()) == 8034
    assert r.headers["X-Total-Count"] == "8034"


def test_plays_va_en_orden_cronologico_y_con_los_campos_del_contrato(client):
    primera = client.get("api/plays", params={"limit": 1}).json()[0]
    assert primera == {
        "gameId": 2021090900, "playId": 97, "quarter": 1, "gameClock": "13:33", "down": 3, "yardsToGo": 2,
        "possessionTeam": "TB", "defensiveTeam": "DAL", "yardlineSide": "TB", "yardlineNumber": 33,
        "offenseFormation": "SHOTGUN", "pff_passCoverage": "Cover-1", "pff_playAction": 0,
        "passResult": "I", "prePenaltyPlayResult": 0,
        "playDescription": "(13:33) (Shotgun) T.Brady pass incomplete deep right to C.Godwin.",
    }


def test_plays_filtra_por_down_y_cuarto(client, validas):
    esperado = len(validas.query("down == 3 and quarter == 4"))
    r = client.get("api/plays", params={"down": 3, "quarter": 4})
    filas = r.json()
    assert len(filas) == esperado > 0
    assert all(p["down"] == 3 and p["quarter"] == 4 for p in filas)
    assert r.headers["X-Total-Count"] == str(esperado)


@pytest.mark.parametrize("bucket,minimo,maximo", [("1-3", 0, 3), ("4-6", 4, 6), ("7-10", 7, 10), ("11+", 11, 99)])
def test_plays_filtra_por_distancia(client, validas, bucket, minimo, maximo):
    esperado = len(validas.query("@minimo <= yardsToGo <= @maximo"))
    filas = client.get("api/plays", params={"bucket": bucket}).json()
    assert len(filas) == esperado > 0
    assert all(minimo <= p["yardsToGo"] <= maximo for p in filas)


def test_plays_limit_y_offset_paginan_sin_cambiar_el_total(client):
    todo = client.get("api/plays").json()
    r = client.get("api/plays", params={"limit": 5, "offset": 2})
    assert r.json() == todo[2:7]
    assert r.headers["X-Total-Count"] == "8034"


def test_plays_nulos_salen_como_cadena_vacia(client, validas):
    # 118 jugadas válidas en la yarda 50 no traen yardlineSide.
    sin_lado = validas.yardlineSide.isna().sum()
    filas = client.get("api/plays").json()
    assert sum(p["yardlineSide"] == "" for p in filas) == sin_lado > 0


@pytest.mark.parametrize("params", [{"down": 0}, {"down": 5}, {"quarter": 6}, {"bucket": "99"}, {"limit": 0}])
def test_plays_rechaza_parametros_fuera_de_rango(client, params):
    assert client.get("api/plays", params=params).status_code == 422


# ---------- /api/games ----------
def test_games_semana_6_tiene_14_partidos_sin_los_equipos_en_descanso(client):
    juegos = client.get("api/games", params={"week": 6}).json()
    assert len(juegos) == 14
    equipos = {e for g in juegos for e in (g["home"], g["away"])}
    assert not equipos & {"ATL", "NO", "NYJ", "SF"}


def test_games_cuenta_por_semana(client):
    por_semana = [len(client.get("api/games", params={"week": w}).json()) for w in range(1, 9)]
    assert por_semana == [16, 16, 16, 16, 16, 14, 13, 15]


def test_games_hora_de_inicio_en_utc(client):
    # TB vs DAL, jueves 9 de septiembre, 8:20 p.m. del Este (EDT, UTC-4) = 00:20 UTC del 10.
    g = next(x for x in client.get("api/games", params={"week": 1}).json() if x["gameId"] == 2021090900)
    assert (g["home"], g["away"], g["week"]) == ("TB", "DAL", 1)
    assert g["kickoffIso"] == "2021-09-10T00:20:00Z"


def test_games_estadisticas_del_equipo_ofensivo(client, validas):
    d = validas.query("gameId == 2021090900 and possessionTeam == 'DAL'")
    intentos = d[d.passResult.isin(INTENTOS)]
    g = next(x for x in client.get("api/games", params={"week": 1}).json() if x["gameId"] == 2021090900)
    s = g["stats"]["away"]
    assert s["attempts"] == len(intentos)
    assert s["comp"] == round(100 * (intentos.passResult == "C").mean(), 1)
    assert s["ya"] == round(intentos.prePenaltyPlayResult.mean(), 1)
    assert s["sack"] == round(100 * (d.passResult == "S").mean(), 1)


@pytest.mark.parametrize("week", [0, 9])
def test_games_rechaza_semana_fuera_de_rango(client, week):
    assert client.get("api/games", params={"week": week}).status_code == 422
