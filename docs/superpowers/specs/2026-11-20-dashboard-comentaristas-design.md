# Diseño: dashboard para comentaristas de la NFL

Fecha: 20 de noviembre de 2026. Estado: borrador para aprobación.
Contexto de datos: [AnalisisData.md](../../AnalisisData.md). Estructura del repositorio: [EstructuraProyecto.md](../../EstructuraProyecto.md).
Dirección visual elegida: **A "Sala de análisis"** con el **split-flap** de la opción C.

## 1. Intención

Una página web de análisis para comentaristas de la NFL. Les sirve para preparar y consultar las semanas 1 a 8 de 2021 y salir con datos listos para decir en cabina, en inglés o en español de México.

Los datos son históricos, así que no hay uso en vivo. Criterio de éxito (propuesto): en menos de 10 segundos en la página inicial, el comentarista tiene tres datos para comentar y sabe dónde profundizar.

## 2. Metas, no metas y antimetas

**Metas**
- Página inicial con resumen: jugada destacada animada, mejor juego, jugador, equipo y pass rusher de las semanas, pulso semanal de la liga, gráfica por cobertura y puntos para comentar.
- Barra lateral que se expande, con diez apartados (sección 5).
- Inglés por defecto, con interruptor a español de México (formatos de México, términos del juego en inglés).
- Glosario tipo wiki, buscable y bilingüe, enlazado desde los términos que aparecen en pantalla.
- Gráficas, tableros animados y herramientas interactivas.
- Un mapa de dónde irían las transiciones (sección 9), sin implementarlas.

**No metas**
- Cargar datos reales, crear rutas `/api/...` o tocar `backend/`.
- IA con Bedrock.
- Modificar `README.md`.
- Implementar transiciones entre páginas.
- Reproducir tracking real (el reproductor usa una jugada de ejemplo).
- Modo claro.

**Antimetas (el trabajo falla aunque compile)**
- Que se vea como una plantilla genérica de tarjetas idénticas.
- Que una cifra de ejemplo pueda confundirse con un dato real.
- Que el movimiento compita con el campo animado o canse en sesiones largas.
- Romper el contrato de despliegue (rutas con diagonal inicial, `localhost`, URLs absolutas).

## 3. Restricciones

- Stack fijo de `.kiro/steering/rules.md`: React 18.3.1, Vite 5.4.21, TypeScript 5.7.3, Tailwind 3.4.19 (sintaxis de la versión 3) y Recharts 3.10.1. **Sin dependencias nuevas.**
- Por eso no hay librería de rutas, de animación (Motion, Framer), de idiomas ni de íconos, y no se cargan fuentes por URL externa.
  - Navegación con hash (`#/games`), que funciona en la subruta de AWS.
  - Idiomas con un diccionario propio y `Intl`.
  - Íconos en SVG propio.
  - Fuentes del sistema.
  - Animación con CSS, Web Animations API y SVG (SMIL).
- Todas las rutas del dashboard son relativas y sin diagonal inicial. `vite.config.ts` conserva `base: './'`.
- `data/` es solo lectura y en esta fase no se lee.
- Se agrega a `vite.config.ts` el proxy de `/api` hacia `http://localhost:8000` (lo exigen las reglas). `backend/` no se toca: montar `dashboard/dist` en FastAPI es la primera tarea de la fase de datos. Hasta entonces, una versión desplegada en AWS no mostraría la página.
- La documentación del proyecto vive en `docs/`. El `README.md` principal no se modifica.

## 4. Enfoques considerados

### 4.1 Dirección visual (elegida por el equipo: A con el split-flap de C)

| Opción | Qué ofrece | Costo |
|---|---|---|
| A. Sala de análisis | Tema oscuro de césped nocturno, barra lateral de vidrio, campo animado como pieza principal. Azul para referencia y amarillo para destacado, como en la transmisión | El tema oscuro exige cuidar el contraste |
| B. Hoja de cabina | Claro y denso, estilo tablero de spotter, imprimible | El menos vistoso para "tableros animados" |
| C. Marcador | Cifras split-flap, rótulo de transmisión y cinta de datos | La cinta en movimiento constante cansa y compite con la lectura |

Se eligió A por la cabina con poca luz y porque su pieza principal es una animación con propósito. Del lenguaje de B se conservan las reglas de gráficas (gris primero, un solo acento, etiquetas directas). La hoja imprimible entra en Notas de cabina: se imprime con `window.print()` y una hoja de estilos de impresión.

### 4.2 Dónde va el split-flap

| Variante | Resultado |
|---|---|
| **a. Dentro del pulso semanal, con selector de semana (W1 a W8)** | Los dígitos giran al cargar y al cambiar de semana. El movimiento explica un cambio de datos y el campo sigue siendo la pieza principal |
| b. Tablero grande aparte, como en C | Duplica los mismos cuatro indicadores y compite con el campo |
| c. En las tarjetas de Mejor juego, Jugador, etc. | Gira todo el tiempo y diluye el efecto |

Se propone la variante **a** (decisión mía, por revisar). Reglas: máximo cuatro valores con split-flap por página y ningún otro uso.

### 4.3 Cómo se construye (decisiones mías)

| Tema | Decisión | Alternativa descartada |
|---|---|---|
| Navegación | Hash (`#/overview`) con una función propia | Una sola página con scroll: no sirve para diez apartados |
| Idioma | Contexto de React más diccionario tipado `{ en, es }`, guardado en `localStorage` | Archivos JSON sueltos: pierden el chequeo de tipos |
| Gráficas | Recharts por defecto (líneas, barras, dispersión, minigráficas). SVG propio solo para el campo y el split-flap | SVG propio para todo: más código sin ganancia |
| Animación | CSS y Web Animations API. El campo usa SVG con SMIL | Librería de springs: no cabe en el stack |
| Springs de apple-design | Se aproximan con `linear()` de CSS donde haga falta | Ninguna |

## 5. Apartados de la barra lateral

Colapsada mide 68 px y muestra íconos. Al expandirse (272 px) muestra nombre y descripción corta. Se superpone al contenido como vidrio translúcido y no lo desplaza.

| Apartado (EN / ES) | Pieza central | Herramienta interactiva | Datos que la alimentan (`docs/AnalisisData.md`) |
|---|---|---|---|
| Overview / Resumen | Ver sección 6 | Selector de semana, reproductor de jugada | plays, pffScoutingData, games |
| Games / Partidos | Ficha del partido con hora local y eficiencia de pase de cada equipo | Selector de semana y equipo | games, plays |
| Plays / Jugadas | Tabla de jugadas con el campo como detalle | Filtros por down, distancia y cuarto | plays (tracking después) |
| Teams / Equipos | Perfil: formaciones, coberturas enfrentadas y presión | Comparador equipo contra equipo | plays, pffScoutingData |
| Players / Jugadores | Ficha con posición, estatura, peso, universidad y edad | Comparador de dos jugadores | players, pffScoutingData |
| Matchups / Duelos | Presión contra protección: quién superó a quién | Orden por bloqueos ganados y presiones | pffScoutingData |
| Schemes / Esquemas | Mapa de calor formación por cobertura, con play action | Selector de métrica | plays |
| Situations / Situaciones | Matriz de down por distancia, red zone y cierre de cuarto | Selector de down y distancia | plays |
| Booth Notes / Notas de cabina | Puntos fijados y hoja para imprimir | Fijar, quitar, imprimir | Local (`localStorage`) |
| Glossary / Glosario | Wiki bilingüe por categorías | Búsqueda, navegación por letra | Diccionario propio (sección 8) |
| Data notes / Notas de datos (pie) | Alcance (semanas 1 a 8, solo pases), calidad y faltantes | Ninguna | Secciones 5, 6 y 8 del análisis |

Alcance de esta fase:
- **Overview, Glossary y Booth Notes completos y funcionales.** En Booth Notes, fijar, quitar e imprimir funcionan y se guardan en `localStorage`.
- **Los otros siete apartados** existen con su pieza central. **Por confirmar con el equipo:** que la herramienta de la tabla funcione sobre datos de ejemplo (recomendado), con selectores, filtros y comparadores activos y el interruptor yardas a metros. La alternativa es dejarlos solo dibujados, sin controles activos.

Glosario: unos 40 términos en cinco categorías (posiciones, jugadas y situaciones, formaciones y coberturas, métricas, campos de datos). Los códigos sin diccionario oficial (`pff_blockType`, `pff_positionLinedUp`, eventos, `UNKNOWN`) entran marcados como "inferido, pendiente de diccionario oficial". El equipo revisa las definiciones en español antes de entregar.

## 6. Página inicial (Overview)

```
┌──┬───────────────────────────────────────────────────────────┐
│≡ │ Weeks 1-8, 2021 season                  [buscar]  [EN|ES] │
│▣ │ [Sample data]                                              │
│▤ ├──────────────────────────────────────┬────────────────────┤
│  │ Campo animado (jugada de las semanas)│ Datos de la jugada │
│  │ línea azul = scrimmage, amarilla =   │ Replay / Pause     │
│  │ primer down                          │ línea de tiempo    │
│  ├──────────┬──────────┬──────────┬─────┴────────────────────┤
│  │ Best game│ Player   │ Team     │ Pass rusher              │
│  ├──────────┴───┬──────┴──────────┴──┬───────────────────────┤
│  │ Pulso por    │ Cover-0 limita a   │ Puntos para comentar  │
│  │ semana con   │ 55% (gráfica de    │ (copiar y fijar)      │
│  │ split-flap   │ puntos)            │                       │
└──┴──────────────┴────────────────────┴───────────────────────┘
```

Criterios provisionales para los destacados. Se confirman al conectar los datos, porque el análisis indica que no hay marcador final ni ganador:
- **Best game:** yardas por pase combinadas y jugadas de 20 o más yardas.
- **Player:** mejor quarterback en yardas por intento, con un mínimo de intentos.
- **Team:** mejor ataque aéreo en yardas por intento, mostrando la presión sufrida.
- **Pass rusher:** más presiones (golpes, hurries y sacks).
- Los títulos dicen "of the weeks" y la página aclara "Pass plays only".

La búsqueda (Ctrl K) es una paleta de comandos funcional sobre los apartados, los equipos y jugadores de ejemplo y los términos del glosario.

Los puntos para comentar se generan con reglas sobre los datos, no con IA. Cada uno lleva sus términos enlazados al glosario.

## 7. Sistema visual

| Elemento | Valor |
|---|---|
| Fondo | Césped nocturno `#10201A`. Campo en bandas `#112419` y `#142A21`, zonas de anotación `#0C1812` |
| Texto | Tiza `#EEF1EA`. Secundario `#9DB0A5`. Línea fina `rgba(238,241,234,.13)` |
| Azul `#4C8DFF` | Referencia y contexto: línea de scrimmage, promedio |
| Amarillo `#FFD43B` | Lo destacado: línea de primer down, valor clave, semana seleccionada |
| Coral `#FF6B5E` | Presión y valores desfavorables |
| Gris | Color por defecto de toda serie sin énfasis |
| Tipografía | Fuente del sistema. Títulos con tracking negativo (−0.024 em a 27 px). Cifras tabulares. Mosaicos del split-flap en monoespaciada del sistema |
| Radios | Campo 18 px, paneles 14 px, controles 10 px. Se varían a propósito para marcar jerarquía |
| Vidrio | Barra lateral con `backdrop-filter`. Con `prefers-reduced-transparency` pasa a sólido |

Reglas de gráficas (Tufte): sin leyendas, etiquetas directas, sin cuadrícula ni bordes superior y derecho, ejes que solo cubren el rango de los datos, línea de referencia en cada gráfica, título que enuncia el hallazgo y alternativa de texto (`aria-label`). Los tooltips son texto plano y tienen equivalente con foco y toque.

**Split-flap.** Mosaicos de 28 × 42 px con bisagra al centro, punto decimal y unidad en amarillo. Al cargar Overview y al cambiar de semana, cada mosaico gira unas 7 veces (70 ms por giro, 90 ms de desfase entre mosaicos) y termina fijo en su dígito final. El valor se expone con `role="img"` y `aria-label`. Con `prefers-reduced-motion` no gira. El selector de semana cambia además el punto de cada minigráfica y la diferencia contra las semanas anteriores.

**Campo animado.** SVG con ciclo de 6.5 s: snap, presión, lanzamiento y recepción. Tiene pausa, repetición y línea de tiempo arrastrable. Con `prefers-reduced-motion` se queda en el cuadro final. La referencia visual es el mockup de la sesión de brainstorming (HTML temporal, fuera del repositorio).

## 8. Idioma y formatos

| Concepto | Inglés | Español (México) |
|---|---|---|
| Fecha | Sun, Oct 10, 2021 | dom 10/10/2021 |
| Hora | 1:00 PM ET | 12:00 h (CDMX), con `Intl` y `America/Mexico_City` |
| Estatura y peso | 6-4, 225 lb | 1.93 m, 102 kg (1 in = 2.54 cm, 1 lb = 0.4536 kg, kg al entero) |
| Velocidad | mph | km/h (1 yd/s = 3.2918 km/h) |
| Yardas | yd | yd. Interruptor a metros (1 yd = 0.9144 m), por confirmar |
| Miles y decimales | 1,679 y 62.0 | Igual (México usa coma de miles y punto decimal) |
| Down | 3rd & 8 | 3.º y 8 |

Nota de horario: Estados Unidos cambió de horario el 7 de noviembre de 2021 y México el 31 de octubre. El partido del lunes 1 de noviembre (semana 8) tiene 2 horas de diferencia y el resto 1 hora. `Intl` lo resuelve sin código especial.

Se quedan en inglés: quarterback (QB), snap, sack, blitz, shotgun, play action, down, red zone, scramble, touchdown, pass rush, pass rusher, hurry, Cover-0/1/2/3, first down (en prosa: "primer down"). El resto del texto se traduce. Los términos con definición se dibujan con un componente `Term`, que toma su texto del mismo diccionario del Glosario.

Las descripciones de jugada del archivo vienen en inglés (calidad de datos, punto 18). Cómo mostrarlas queda para la fase de datos.

## 9. Mapa de transiciones (no se implementan en esta fase)

| Dónde | Qué cambia | Mecanismo recomendado | Con `prefers-reduced-motion` |
|---|---|---|---|
| Barra lateral | Se expande y se contrae | CSS, 280 ms. Ya está en el mockup | Sin animación |
| Cambio de apartado | El contenido sale y entra | View Transitions API si existe. Si no, fundido | Fundido corto |
| Tarjeta del Overview a su apartado | La tarjeta se convierte en el encabezado del detalle | View Transitions con `view-transition-name` | Fundido |
| Cambio de idioma | El texto cambia sin mover el diseño | Fundido de 150 ms con anchos fijos | Sin animación |
| Selector de semana | Giro del split-flap, punto de la minigráfica, diferencia | Web Animations API | Cambio directo |
| Filtros y métricas en gráficas | Barras y puntos se reubican | Animación nativa de Recharts, 300 ms | Desactivada |
| Reproductor de jugada | Movimiento continuo | SVG con SMIL, ya está en el mockup | Cuadro final |
| Popover del glosario | Nace en el término que lo abrió | Escala y fundido, 150 ms | Fundido |
| Copiar y fijar | Cambia el ícono y aparece "Copied" | Cambio de ícono, 1.4 s | Igual |
| Búsqueda (Ctrl K) | Aparece sobre el contenido | Desenfoque y escala | Fundido |
| Entrada al Overview | Una sola escena: se dibuja el campo y giran los mosaicos | Orquestación una vez por sesión | Sin escena |

## 10. Datos de ejemplo

- Los datos de ejemplo son **agregados por vista** (por ejemplo el resumen, el perfil de un equipo), con tipos que usan los nombres de columna reales (`passResult`, `prePenaltyPlayResult`, `pff_passCoverage`). Los componentes nunca agregan filas: los datos reales (8,557 jugadas, 188,254 filas de PFF y 811 MB de tracking) se agregan en el servidor.
- Todo pasa por una capa `dashboard/src/data/` con una función por vista. Hoy devuelve los datos de `sample/`. Después hace `fetch('api/...')` sin cambiar los componentes.
- Mientras los datos sean de ejemplo (un solo indicador `IS_SAMPLE`), todo texto que sale de la página lleva la marca. El texto copiado termina en "(sample data)" o "(datos de ejemplo)", las notas fijadas guardan la marca y la hoja impresa lleva marca de agua. Al conectar datos reales se apaga en un solo lugar.
- Etiqueta "Sample data / Datos de ejemplo" visible en cada página.
- Nombres inventados ("J. Sample", "M. Sample"). Las abreviaturas de equipo sí son reales, porque están en los datos. Un catálogo fijo de 32 equipos con nombre y color queda para la fase de datos.

## 11. Estructura de código propuesta

```
dashboard/src/
  main.tsx, App.tsx              estructura: barra lateral y contenido
  app/router.ts                  navegación por hash
  i18n/                          diccionario, formatos (Intl), contexto de idioma
  components/                    Sidebar, TopBar, CommandPalette, SplitFlap, FieldPlay, Sparkline, DotPlot, Term, TalkingPoints
  data/                          una función por vista (hoy devuelve ejemplos, después llama a la API)
  pages/                         Overview, Games, Plays, Teams, Players, Matchups, Schemes, Situations, BoothNotes, Glossary, DataNotes
  sample/                        datos de ejemplo tipados
  index.css                      tokens como variables CSS
```

## 12. Accesibilidad y calidad mínima

- Foco visible, teclado completo en barra lateral, pestañas, selector de semana y línea de tiempo.
- Respeta `prefers-reduced-motion`, `prefers-reduced-transparency` y `prefers-contrast`.
- Contraste de texto de 4.5:1 o más (se mide al construir).
- Cada gráfica tiene alternativa de texto.
- Responsive: de 1440 px a 390 px. Por debajo de 1100 px los bloques se apilan y la barra lateral siempre se superpone.

## 13. Verificación al construir

- `npm run build` en `dashboard/` sin errores de tipos. Como el backend aún no sirve `dashboard/dist`, la revisión visual usa `npm run dev` y `vite preview`.
- `sh .hackathon/setup.sh --check`.
- Búsqueda de rutas con diagonal inicial, de `localhost` y de URLs absolutas en `dashboard/src`: cero resultados.
- Revisión visual con capturas a 1440 y 390 px, en inglés y en español, y con movimiento reducido.
- Prueba de teclado de la barra lateral y del selector de semana.

## 14. Decisiones que tomé yo (revisar)

1. Variante **a** del split-flap: dentro del pulso semanal, con selector de semana.
2. Alcance: Overview y Glossary completos, los demás apartados con una pieza central de ejemplo.
3. Diez apartados, agrupados por separadores (Resumen, Partidos y Jugadas; Equipos, Jugadores, Duelos, Esquemas y Situaciones; Notas y Glosario).
4. Las yardas se quedan en yardas en español, con interruptor opcional a metros.
5. Criterios de "mejor juego", "jugador", "equipo" y "pass rusher" basados en métricas de pase.
6. Puntos para comentar generados con reglas, sin IA.
7. Navegación por hash, idioma guardado en `localStorage`, tema oscuro único.
8. Proxy de `/api` en Vite ahora. El montaje de `dashboard/dist` en el backend queda para la fase de datos.
9. Datos de ejemplo como agregados por vista, detrás de una capa `data/`.
10. Marca de "datos de ejemplo" también en el texto copiado, en las notas fijadas y en la hoja impresa.
11. Glosario de unos 40 términos. Los códigos de datos sin diccionario van marcados como inferidos.
12. Booth Notes completo (fijar, quitar, imprimir) y búsqueda Ctrl K funcional.

## 15. Se deja al constructor

Detalle de cada componente, qué gráficas van en Recharts y cuáles en SVG propio, el contenido fino de los apartados que no son Overview ni Glossary, la implementación del router y los textos de ejemplo de cada apartado. El mockup es un archivo temporal en `/tmp`. Conservarlo en el repositorio queda por decidir, porque `docs/` solo contiene archivos `.md`. Si no se conserva, esta especificación (colores, medidas, tiempos, textos) es la fuente.
