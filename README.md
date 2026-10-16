# KoyJabo – Dhaka Transit Navigator (React + Leaflet)

Interactive map for a Dhaka multi-modal route planner. 14 hubs, directed connections with multiple services,
depth-limited DFS (max 6 hops), Cheapest / Fastest / Balanced routes, backup route, and a what-if simulator.
Free stack: React, Vite, Leaflet, OpenStreetMap tiles (no API key).

## Run
    npm install
    npm run dev        # http://localhost:5173
    npm test           # engine tests (node, no browser)
    npm run build

## How engine results reach the map
`data/network.js` (hubs, edges, services) → `engine/router.js` `findRoutes(origin, dest, constraints, scenario)`
returns routes with ordered `hubIds`, `segments`, merged `legs`, fare range, time, transfers →
`App.jsx` picks the selected route → `MapView.jsx` converts `hubIds` to coordinates and draws every hub in order.
The map never validates routes; blocked-link styling comes from `edgeStatus()` in the engine.

## Files
- `src/data/network.js` – hubs, lines, edges (EDIT HERE to change data)
- `src/engine/router.js` – DFS, service expansion, time/fare/transfer calc, rankings, backup, explanations
- `src/components/MapView.jsx` – Leaflet map; `src/App.jsx` – panel, selectors, simulator
- `tests/engine.test.mjs` – hand-calculated engine tests

## Data honesty
Coordinates are approximate area centres; lines, times, distances and fares are PROTOTYPE values; the metro fare
formula is provisional. Simulated conditions are labelled "SIMULATED"; nothing is live data.

## Not included (yet)
CMS/CRUD for routes & alerts, crowd-sourced alert confirmation/decay, chat assistant / Banglish parsing, AI grounding,
Pareto filtering. Engine is synchronous (fast for 14 hubs).

## Manual map checklist
14 hubs visible · all links drawn · route passes through intermediate hubs in order · each goal highlights its route ·
backup is orange dashed · blocking a link turns it red and route changes · no-route shows message, no line ·
resize/hide panel keeps map sized · same route for two goals is drawn once.
