# Deployment Runbook

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- PM2 (`npm install -g pm2`)
- Nginx + Certbot (for SSL)

---

## PostgreSQL Tuning (#10)

Before starting the server, raise PostgreSQL's connection limit. The default of 100 is too low — with a pool of `max: 3` per user database, 50 active users can open up to 150 connections.

Edit `/etc/postgresql/<version>/main/postgresql.conf`:

```
max_connections = 200
shared_buffers = 256MB        # ~25% of RAM on a 1GB VPS; raise proportionally
```

Then restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

Monitor connection usage in production:

```sql
-- Run on the master DB to see live connection count
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check size of each user database
SELECT datname, pg_size_pretty(pg_database_size(datname))
FROM pg_database ORDER BY pg_database_size(datname) DESC;
```

---

## Deploy Steps

```bash
# 1. Pull latest code
git pull origin main

# 2. Install backend deps
cd express && npm install --omit=dev

# 3. Set environment variables
cp .env.example .env   # then edit DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME,
                        # JWT_SECRET, CLIENT_ORIGIN, NODE_ENV=production

# 4. Run migrations (creates all master DB tables)
npm run db:migrate

# 5. Build the React client
cd ../client && npm install && npm run build

# 6. Start with PM2
cd ../express
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup    # follow the printed command to enable auto-restart on reboot

# 7. Configure Nginx (see nginx.conf.example) + SSL
sudo certbot --nginx -d yourdomain.com
```

## PM2 Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## Health Check

```
GET https://yourdomain.com/health
→ 200 { "status": "ok", "db": "ok", "uptime": 1234.5 }
→ 503 { "status": "error", "db": "unreachable" }   ← if master DB is down
```

Point UptimeRobot (or equivalent) at `/health` with a keyword match on `"status":"ok"`.

---

## Scaling Beyond 50 Users

At ~200+ users, consider migrating from one-database-per-user to one-schema-per-user
inside a single PostgreSQL database. This removes the per-DB connection overhead and
allows a single shared pool (or pgBouncer). See `fixes_wip.md #10` for the migration
path details.
