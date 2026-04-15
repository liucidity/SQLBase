# SQLBase — Implementation Phases

## Phase 1: Fix Auth → Database Linkage (Root Cause) ✅

**1a. Fix `useDatabase.js` — remove hardcoded `userID = 1`**
- Pull `user.id` from `AuthProvider` context instead of hardcoding
- Update `saveProgress()`, `createDatabase()`, `loadDatabase()`, `deleteDatabase()` to use real user ID
- Fix broken route path in `deleteDatabase()` (missing leading `/`)

**1b. Add `withCredentials: true` to all axios/fetch calls**
- Every request to the backend needs credentials so the JWT cookie is sent
- Affects: `useDatabase.js` (axios), `AuthProvider.js` (fetch), and any other API calls

**1c. Protect all backend routes with `authenticate` middleware**
- Add to: `/api/tables`, `/api/virtualDatabases`, `/api/seed`, `/api/query`
- Use `req.user.id` server-side instead of trusting client-sent `userID`

**1d. Backend: scope database queries by `user_id`**
- Ensure GET/PUT/DELETE on `/api/databases` filter by `req.user.id`

---

## Phase 2: Fix My Databases (Empty List) ✅

- `createDatabase` now awaits `saveProgress()` before creating the PG database
- Defensive JSON parsing in `UserDatabases.js` (skip corrupted rows)

---

## Phase 3: Fix Seeds Tab ✅

**3a.** `initialSeedState` changed from hardcoded `{companies, employees, products}` to `{}`
**3b.** Added `genericSeed()` fallback in `useSeedState.js` — generates typed fake data for any custom table by reading `state.schemaState`
**3c.** `SeedsModal.js` null guard — shows "No seed data generated yet" instead of crashing
**3d.** `generateSeedSQL` skips tables with empty arrays (prevents invalid SQL)

---

## Phase 4: Toast Notification System ✅

- Added `SuccessSnackbar` to `CreateSeeds.js`, `CreateQueries.js`, `UserDatabases.js`
- `useDatabase.js` rewritten to throw on error (all `.catch(err => console.log)` swallowing removed)
- Error snackbars shown on all async failures

---

## Phase 5: Fix Queries

- The "Load" dropdown is empty because it reads saved databases from the same broken pipeline (Phase 1 fix)
- Once databases are properly linked to users and loadable, the query page should be able to:
  - List the user's databases
  - Connect to the selected database
  - Execute SQL and display results
- Verify the `/api/query` route works end-to-end with a real user database

---

## Phase 6: Fix Charts

- Currently charts read from `useChartsState` and `useSeedState` which may reference stale or demo data
- Wire charts to use actual query results from the user's database
- Flow: user runs a query → results populate a table → user picks columns for X/Y axis → chart renders
- Ensure Recharts `Pie` and `Bar` components receive real data arrays

---

## Phase 7: AI Database Generation (New Feature)

- Add a "Generate with AI" button on the Schema page
- User enters a natural language prompt (e.g., "e-commerce store with users, products, orders, and reviews")
- Backend sends prompt to Claude API, returns structured JSON (table names, columns, types, foreign keys)
- Frontend parses response and populates the schema builder form
- User can then edit/tweak before creating

---

## Additional Suggestions

1. **Database name uniqueness per user** — prefix with user ID or UUID (e.g., `u5_my_store`) to prevent cross-user collisions in PostgreSQL
2. **Connection pooling** — replace per-request `new Client()` with a connection pool
3. **Rate limiting** — add rate limits on auth endpoints and database creation
4. **Database size/count limits** — cap databases per user
5. **Export feature** — export schema as SQL DDL or query results as CSV
