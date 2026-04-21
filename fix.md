# Fly.io Deployment Fix

## Root Cause
`min_machines_running = 0` caused the app machine to fully stop when idle.
On cold start, the startup DB health check (`SELECT 1` → `process.exit(1)` on failure)
would crash the machine before Fly could mark it healthy.

## Changes Made
`fly.toml`:
- `auto_stop_machines`: `stop` → `suspend` (2s resume vs 15-30s cold boot)
- `min_machines_running`: `0` → `1` (always keep one instance alive)

## Deploy
```bash
fly deploy
```

## Verify Postgres machine is healthy
```bash
fly pg status -a <your-postgres-app-name>
fly logs -a sqlbase
fly machine list -a sqlbase
```

## Test DDL direct connection (port 5433)
```bash
fly ssh console -a sqlbase
nc -zv <pg-host> 5433
```

## Why free alternatives don't work
SQLBase uses `CREATE DATABASE` (superuser DDL). Managed Postgres services
(Supabase, Neon, Railway, Render) restrict this — you get one database, no superuser.
Fly Postgres is the right platform for this architecture.

## Long-term option: schema-based multi-tenancy
Replace `CREATE DATABASE` with `CREATE SCHEMA schema_<uuid>` inside one database.
Unlocks any managed Postgres free tier. Requires refactoring:
- `express/helpers/dbHelpers.js` — createDB/dropDB → createSchema/dropSchema
- `express/helpers/clientHelpers.js` — set `search_path` per request
- `express/helpers/virtualDBHelpers.js` — prepend schema to all table references
