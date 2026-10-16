# KoyJabo – Dhaka Multimodal Transit Navigator & Disruption Engine

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet%201.9-199900)](https://leafletjs.com/)
[![NodeJS](https://img.shields.io/badge/Backend-Node.js%20Zero--Dep%20%2F%20Express-339933)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**KoyJabo** (কই যাবো) is an intelligent, crowd-grounded multimodal transit navigator engineered specifically for Dhaka's complex urban transit ecosystem. It bridges MRT-6 Metro Rail, local bus corridors, leguna routes, rickshaw paths, and CNG routes with real-time disruption dispatching, fare verification, and community traffic telemetry.

---

## 🌟 Key Features

1. **Multimodal Routing Engine (`src/engine/router.js` & `server/engine/router.js`)**:
   - Depth-limited DFS across 14 major Dhaka transit hubs and 17 direct road connections.
   - Goals: **Cheapest**, **Fastest**, **Balanced**, and **All Three** simultaneous corridor visualization.
   - Dynamic backup detour planning with trigger diagnostics.
   - Student discount pass calculation (Half-Fare rules for local buses; MRT & leguna compliance).

2. **Real-time Road & Service Disruption Dispatcher**:
   - Admin roadblock dispatcher with reason tagging (Waterlogging, VIP Movement, Heavy Rain, Construction, Protest).
   - Real-time road block propagation with visual red-dashed map polylines and `⛔ ROAD BLOCKED` tooltips.
   - Commuter detour guards: optional detour routing with emergency bypass notices.

3. **Admin Control Portal**:
   - Dispatcher panel to block/delay roads and transit lines.
   - Regulatory BRTA fare chart management with automatic fuel-surcharge adjustments.
   - Incident moderation queue with community vote verification and audit log.

4. **Fare Truth Checker**:
   - Community-grounded fare verification against BRTA rates and recorded medians.
   - Realistic fare filters with anomaly detection.

5. **Crowdsourced Incident & Traffic Telemetry**:
   - Citizen reporting with Banglish NLP parsing.
   - Disruption dispute resolution with automated credibility scoring.

6. **Interactive Leaflet Transit Map**:
   - High-contrast custom station markers, route-colored active paths, and multi-corridor rendering.

---

## 🚀 Quick Start

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/smasim825/IAIT_hackathon.git
cd IAIT_hackathon

# Install dependencies
npm install
```

### 2. Running Locally

You can run both the Vite frontend and the Node.js backend:

```bash
# Run backend API server (port 3000)
npm run server

# In another terminal, run Vite frontend (port 5180)
npm run dev
```

Open [http://localhost:5180](http://localhost:5180) in your browser.

- **Commuter Portal**: `http://localhost:5180/`
- **Admin Dispatcher Portal**: `http://localhost:5180/admin` (Demo credentials available on screen)

---

## 🧪 Testing

```bash
# Run core routing engine tests
npm test

# Run backend API and integration test suite (85 tests)
npm run test:backend

# Run 17-road-edge blocking verification test
node tests/road_blocking_17_edges.test.mjs
```

---

## 📂 Project Architecture

```
├── public/                 # Static assets & standalone HTML client
├── server/                 # REST API, in-memory state engine, Banglish parser, AI tools
│   ├── engine/             # Grounding, routing, fare tables, simulation engine
│   ├── routes/             # API routes (search, admin, alerts, fares, health, scenario)
│   └── store/              # State persistence and seed data
├── src/                    # React 18 SPA (Vite)
│   ├── components/         # MapView, CommuterView, AdminPortal, FareTruthChecker, Navbar
│   ├── data/               # Network hubs, 17 road edges, initial data
│   └── engine/             # Client-side router, bidirectional API sync
└── tests/                  # Exhaustive test suites (engine, API, alerts, fares, road blocks)
```

---

## 📄 License
MIT © 2026 KoyJabo Team
