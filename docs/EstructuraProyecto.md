# Estructura del proyecto: Hackathon NFL Big Data Bowl (UNAM)

Este documento describe qué contiene cada carpeta del repositorio y cómo se relacionan entre sí. Refleja el estado del repositorio al 20 de noviembre de 2026. Para el detalle de las columnas de los datos, ver [AnalisisData.md](AnalisisData.md).

## 1. Vista general

```
hackathon-unam/
├── backend/            API en Python (FastAPI)
├── dashboard/          Frontend (React + Vite + Tailwind + Recharts)
├── data/               Datos del evento (solo lectura)
│   └── tracking/       122 archivos de tracking, uno por partido
├── docs/               Documentación del equipo
├── .hackathon/         Herramientas y reglas del evento (no tocar)
├── .kiro/              Configuración del asistente Kiro
│   ├── steering/       Reglas del proyecto
│   └── skills/         21 skills instaladas
├── .venv/              Entorno virtual de Python 3.12.12 (no tocar)
├── .env.example        Plantilla de credenciales (copiar a .env)
├── .gitignore
├── README.md           README de entrega (hoy solo tiene el título)
├── setup-log.txt       Copia del log de instalación
└── skills-lock.json    Versiones fijas de las skills de .kiro/skills
```

| Carpeta o archivo | Quién la edita | En git | Peso aprox. |
|---|---|---|---|
| `backend/` | El equipo | Sí | 20 KB |
| `dashboard/` | El equipo | Sí, excepto `node_modules/` y `dist/` | 124 MB (casi todo `node_modules/`) |
| `data/` | Nadie (solo lectura) | No, hoy aparece como sin seguimiento | 826 MB |
| `docs/` | El equipo | Sí | 24 KB |
| `.hackathon/` | Nadie | Parcial: no se versionan `.tools/`, `.cache/` ni `setup.log` | 638 MB |
| `.kiro/` | Kiro y el equipo | `steering/` sí, `skills/` no | 3.1 MB |
| `.venv/` | Nadie | No | 30 MB |

## 2. Carpetas de trabajo del equipo

### 2.1 `backend/`

Código Python del servidor.

| Archivo | Contenido |
|---|---|
| `__init__.py` | Vacío. Convierte la carpeta en paquete, por eso se arranca como `backend.main:app`. |
| `main.py` | Crea `app = FastAPI(...)` y expone `GET /health` que responde `{"status": "ok"}`. |

Es el punto de entrada que AWS busca (`backend/main.py` con la variable `app`). Todavía no tiene rutas `/api/...`, no lee `data/` ni carga `.env`.

Arranque en desarrollo (desde la raíz): `.venv/bin/uvicorn backend.main:app --reload`.

### 2.2 `dashboard/`

Aplicación de una sola página con React 18, TypeScript, Vite 5, Tailwind 3 y Recharts 3.

| Archivo | Función |
|---|---|
| `package.json`, `package-lock.json` | Dependencias con versión exacta y scripts: `dev` (Vite), `build` (`tsc --noEmit && vite build`) y `typecheck`. |
| `vite.config.ts` | Configuración de Vite con `base: './'` y el plugin de React. |
| `tsconfig.json` | TypeScript en modo estricto; solo compila `src/` y `vite.config.ts`. |
| `tailwind.config.js`, `postcss.config.js` | Tailwind 3 con PostCSS y Autoprefixer. Tailwind escanea `index.html` y `src/**/*.{ts,tsx}`. |
| `index.html` | Documento base. Contiene `<div id="root">` y carga `/src/main.tsx`. |
| `src/main.tsx` | Monta `<App />` en `#root` e importa `index.css`. |
| `src/App.tsx` | Pantalla de ejemplo con una gráfica de barras de Recharts. Hay que reemplazarla. |
| `src/index.css` | Las tres directivas `@tailwind` (sintaxis de Tailwind 3). |
| `node_modules/` | Dependencias instaladas. No se versiona. |
| `dist/` | Salida de `vite build`. No existe todavía y no se versiona. |

Arranque en desarrollo: `npm run dev` dentro de `dashboard/`.

### 2.3 `data/`

Datos de la temporada 2021, semanas 1 a 8. Es solo lectura: no se modifican los archivos originales.

| Archivo | Filas | Una fila representa |
|---|---|---|
| `games.csv` | 122 | Un partido |
| `players.csv` | 1,679 | Un jugador |
| `plays.csv` | 8,557 | Una jugada de pase |
| `pffScoutingData.csv` | 188,254 | Un jugador en una jugada (22 por jugada) |
| `tracking/tracking_<gameId>.csv` | 8,314,178 en total | Un jugador o el balón en un cuadro de la jugada |

Cómo se cruzan las tablas:

```
games (gameId) ──┬── plays (gameId + playId) ──┬── pffScoutingData (gameId + playId + nflId)
                 │                             └── tracking (gameId + playId + frameId + nflId)
                 └── tracking_<gameId>.csv: el nombre del archivo es el gameId

players (nflId) ── referenciada por nflId desde pffScoutingData y tracking,
                   y por foulNFLId1/2/3 desde plays
```

El análisis verificó que no hay registros huérfanos entre estas tablas (ver sección 3 de [AnalisisData.md](AnalisisData.md)).

### 2.4 `docs/`

| Archivo | Contenido |
|---|---|
| `AnalisisData.md` | Inventario de `data/`, llaves, diccionario de columnas, calidad de datos y propuesta de métricas. |
| `EstructuraProyecto.md` | Este documento. |

## 3. Carpetas de infraestructura (no editar a mano)

### 3.1 `.hackathon/`

Herramientas que el organizador entrega para instalar, validar y empaquetar el proyecto.

| Archivo o carpeta | Función |
|---|---|
| `setup.sh`, `setup.cmd`, `setup.ps1` | Envoltorios por sistema operativo. Buscan Python y ejecutan `setup.py`. |
| `setup.py` | Script principal. Con `--check` valida el entorno. Con `--entregar` valida, revisa el README, compila el dashboard, comprueba que el backend arranque y genera el `.zip`. |
| `stack.json` | Versiones de Python, uv y Node, y los nombres `requirements.txt`, `requirements.lock` y `dashboard`. |
| `requirements.txt`, `requirements.lock` | Paquetes de Python del stack. El `.lock` fija versiones y hashes. |
| `npm-pins.json` | Versiones exactas permitidas para los paquetes de npm. |
| `rules.md` | Reglas del stack y del despliegue. |
| `INSTALACION.md` | Guía de instalación y entrega para participantes. |
| `proyecto` | Marca con la fecha de creación del proyecto. |
| `setup.log` | Log de la última ejecución. No se versiona. |
| `.tools/` | `uv`, Python 3.12.12 y Node 22.23.1 descargados (368 MB). No se versiona. |
| `.cache/` | Caché de descargas de uv y npm (271 MB). No se versiona. |

### 3.2 `.kiro/`

| Carpeta | Contenido |
|---|---|
| `steering/rules.md` | Reglas del proyecto que Kiro aplica siempre. Es copia idéntica de `.hackathon/rules.md`. |
| `skills/` | 21 skills (cada una con su `SKILL.md` y archivos de apoyo). Cubren flujo de trabajo (brainstorming, planes, TDD, depuración, revisión), diseño (frontend, Apple, Tufte para gráficas), y guías de FastAPI, React y rendimiento de Python. |

### 3.3 `.venv/`

Entorno virtual de Python 3.12.12 creado con uv. Contiene FastAPI, Uvicorn, Pydantic, pandas, numpy, strands-agents, boto3, pytest y httpx, con las versiones de `.hackathon/requirements.lock`. Todo el Python del proyecto se ejecuta con este entorno.

## 4. Archivos de la raíz

| Archivo | Función |
|---|---|
| `README.md` | Lo lee `--entregar`: debe existir y no estar vacío. Hoy solo contiene `# NFL-Big-Data-Bowl`. |
| `.env.example` | Plantilla con `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` y `AWS_REGION`. Se copia a `.env` (ignorado por git y excluido del `.zip`) para usar Bedrock en local. |
| `.gitignore` | Excluye `.venv/`, `node_modules/`, `dist/`, `__pycache__/`, `.hackathon/.tools/`, `.hackathon/.cache/`, `.hackathon/setup.log`, `.env*` (menos `.env.example`) y llaves. |
| `setup-log.txt` | Copia de `.hackathon/setup.log` que el script deja en la raíz para enviar a soporte. |
| `skills-lock.json` | Registra la fuente, el commit y el hash de cada skill de `.kiro/skills/`. Las 21 vienen de seis repositorios de GitHub; 15 son de `obra/superpowers`. |

## 5. Relaciones entre carpetas

```
                        ┌──────────────┐   fetch('api/...')    ┌──────────────┐
   navegador ──────────▶│  dashboard/  │──────────────────────▶│  backend/    │
                        │  (React)     │◀──────────────────────│  (FastAPI)   │
                        └──────┬───────┘        JSON           └───┬──────┬───┘
                               │ vite build                        │      │
                               ▼                                   │      │ boto3 (opcional)
                        dashboard/dist ── lo sirve el backend ─────┘      ▼
                                                                  Amazon Bedrock
                                                    lee (pandas)  │       ▲
                                                                  ▼       │ llaves locales
                                                              ┌───────┐ ┌─────┐
                                                              │ data/ │ │.env │
                                                              └───────┘ └─────┘
```

| Origen | Destino | Relación |
|---|---|---|
| `dashboard/` | `backend/` | El frontend llama a `api/<ruta>` con ruta relativa y sin diagonal inicial. En desarrollo, Vite corre aparte y reenvía `/api` a `http://localhost:8000`. En producción ambos comparten URL y puerto. |
| `backend/` | `dashboard/dist/` | En producción el servidor sirve el build del dashboard junto con la API. |
| `backend/` | `data/` | El backend lee los CSV con rutas relativas a la raíz del proyecto, con pandas. Calcula al arrancar o al responder, porque el servidor es efímero y no debe depender de escribir en disco. |
| `backend/` | `.env` | Al inicio de `main.py` se carga `.env` (si existe) para que boto3 use las llaves temporales en local. En AWS no hay llaves: firma el rol de la tarea. |
| `backend/` | `.venv/` | El backend se ejecuta con el Python y los paquetes de `.venv/`. |
| `dashboard/` | `node_modules/` | Se instala desde `package.json` y `package-lock.json`. Las versiones deben coincidir con `.hackathon/npm-pins.json`. |
| `.hackathon/requirements.lock` | `.venv/` | Define exactamente qué se instala en el entorno de Python. |
| `.hackathon/stack.json` | `setup.py` | Indica versiones del stack y que el frontend está en `dashboard/`. |
| `.hackathon/setup.py` | Todo el proyecto | `--check` compara versiones y paquetes con el stack. `--entregar` revisa que el README exista, que no haya rutas con `/` inicial en `dashboard/`, compila el dashboard, prueba que `backend` se importe y arma el `.zip`. El `.zip` omite `.venv`, `.hackathon`, `node_modules`, `.git`, cachés y `.env`; incluye `data/` completo. |
| `.hackathon/rules.md` | `.kiro/steering/rules.md` | `setup.py` copia las reglas a `.kiro/steering/` al instalar y no las sobrescribe si ya existen. Hoy ambos archivos son idénticos. |
| `.kiro/skills/` | `skills-lock.json` | El lock fija de qué repositorio y commit viene cada skill. |
| `docs/AnalisisData.md` | `data/` | Describe los CSV de `data/`. Si cambian los datos, hay que actualizar este documento. |
| `setup-log.txt` | `.hackathon/setup.log` | Mismo contenido. El segundo se ignora en git y el primero no. |

## 6. Estado actual frente al contrato de despliegue

Lo que ya cumple el contrato: `backend/main.py` expone `app` y `GET /health`, `dashboard/vite.config.ts` usa `base: './'`, y el build (`dashboard/dist`) lo genera `vite build`.

Lo que falta para que las piezas queden conectadas:

- `vite.config.ts` no tiene el proxy de `/api` hacia `http://localhost:8000`.
- El backend no tiene rutas `/api/...` ni lee `data/`.
- El backend no sirve `dashboard/dist`.
- `main.py` no incluye la función `cargar_env()` (solo se necesita si se usa IA).
- `App.tsx` sigue siendo la pantalla de ejemplo y no consume la API.
- `README.md` tiene solo el título. `--entregar` lo acepta si no está vacío, pero avisa si es muy corto o no tiene imagen.
- `data/`, `.kiro/skills/` y `skills-lock.json` aparecen como sin seguimiento en git. Confirmar si se quieren versionar, en especial `data/` (826 MB).
