# Deployment Fixes — All Implemented

All items from this list have been implemented. See DEPLOY.md for the operational runbook.

| # | Item | Status | Where |
|---|---|---|---|
| 6 | Inline DDL → migration script | Done | `express/db/migrate.js`, `npm run db:migrate` |
| 7 | Production file logging | Done | `server.js` — writes to `express/logs/access.log` when `NODE_ENV=production` |
| 8 | Health check with DB ping | Done | `GET /health` → `{ status, db, uptime }`, 503 on DB outage |
| 10 | PostgreSQL connection tuning | Done | See `DEPLOY.md` — `max_connections=200`, monitoring queries, scale-out path documented |
