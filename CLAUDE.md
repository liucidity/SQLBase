# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SQLBase is a no-code relational database platform. Users can create schemas (with ERD diagrams), spin up real PostgreSQL databases, seed them with fake data, run queries, and visualize results as charts — all through a form-based UI.

## Commands

### Client (React, port 3000)
```bash
cd client
npm start        # Dev server
npm run build    # Production build
npm test         # Run tests
```

### Express Backend (port 3001)
```bash
cd express
npm start        # node server.js
npm run dev      # nodemon (hot reload)
npm run db:reset # Reset master database
```

The client proxies API requests to `http://localhost:3001` (configured in `client/package.json`).

## Architecture

### Frontend (`client/src/`)
- **Pages** (`components/pages/`) — route-level views: `CreateSchema`, `CreateQueries`, `CreateSeeds`, `CreateCharts`, `UserDatabases`
- **Global State** (`state/`) — Context API + `useReducer` via `GlobalStateProvider`. State holds `databaseName`, `databaseUUID`, schema tables, queries, seeds, and chart config. Hooks in `state/hooks/` provide access.
- **Forms** (`components/forms/`) — schema/query/seed builders that dispatch to global state
- **Charts** (`components/charts/`) — Recharts-based Pie and Bar chart components

Routing is defined in `client/src/index.js`.

### Backend (`express/`)
- **`server.js`** — Express entry point, mounts all routers
- **Routes:**
  - `/api/databases` — CRUD for user database metadata (stores full `global_state` JSON)
  - `/api/virtualDatabases` — higher-level create/seed/query operations
  - `/api/query` — executes arbitrary SQL on a target database
  - `/api/seed` — executes INSERT statements on a target database
  - `/api/tables` — schema storage
- **Helpers:**
  - `helpers/clientHelpers.js` — factory that creates a new `pg` client for a given database name using env vars (`DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`)
  - `helpers/dbHelpers.js` — `queryDB`, `queryDBParams`, `createDB`, `dropDB`
  - `helpers/virtualDBHelpers.js` — `createTable`, `seedTable`, `queryTable`

### Database pattern
Each user database is a real PostgreSQL database. A master DB (connected via `express/db/index.js`) stores metadata. When operating on a user DB, a new `pg` client is created dynamically per request using `clientHelpers.js`.

## Environment Variables (express)
The backend expects a `.env` file with: `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, and a connection string for the master database.
