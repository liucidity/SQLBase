# SQLBase Feature Backlog

## High-Value, Core Workflow

### 1. CSV Import / Export ✅ (implemented)
- Import a CSV to auto-generate a schema (infer column names + types) and seed the table with the real data in one step
- Export query results as CSV from the queries page (already implemented)
- Huge time-saver — most users coming from spreadsheets

### 2. Query History ✅ (implemented)
- Auto-save the last N queries run (per database), shown in a collapsible section on the queries page
- Each entry shows the SQL, timestamp, and row count returned
- Click to reload — no separate "saved query" naming step required
- Stored in localStorage per databaseUuid, complements the existing saved-queries API

### 3. Table Relationships / FK Enforcement ✅ (implemented)
- The schema form supports `reference` and `relationType` fields but seeding didn't respect them
- When seeding a table with a FK column, use actual seeded parent row counts for ID ranges
- INSERT statements are sorted so parent tables are always seeded before child tables

### 4. Schema Templates / Presets ✅ (implemented)
- "Start from a template" option on the schema page: E-commerce, Blog, SaaS, HR, Social Network
- Pre-populates tables and fields — user gets a working database in seconds
- Lowers the cold-start friction massively

### 5. Query Results → Seed (Round-trip)
- Run a query → get results → use those results as seed data for another table
- Enables workflows like "pull from prod, seed local test DB"

### 6. Database Snapshots / Versioning
- Save a named snapshot of a database's current state (schema + seed SQL)
- Restore from snapshot — useful when experimenting with destructive seeds
- Stored as JSON in the master DB alongside the existing `global_state` blob

### 7. Multi-table JOIN Builder
- Current query builder is single-table
- Add a JOIN section: pick a second table, select join column pair, pick join type (INNER/LEFT/RIGHT)
- The SQL panel already shows the output — just the builder UI is missing

### 8. Scheduled Exports / Cron Queries
- Run a saved query on a schedule (daily/weekly), email or download results
- Good for users who want to monitor their seeded dataset over time

---

## Smaller / Faster Wins

### 9. Row-level Seed Overrides
- In the seed config, let users pin specific rows with exact values (e.g., "first row has email = admin@example.com")
- The `seedFieldConfig` infrastructure is already there — it's just fixed-value overrides alongside random ones

### 10. SQL Formatter ✅ (implemented)
- A "Format SQL" button on the query/seed right panels
- Auto-indents and capitalizes keywords
- Cheap to add with a library like `sql-formatter`

### 11. Table Rename / Duplicate ✅ (implemented)
- The ui_redesign.md mentions a `⋯` overflow menu with "Duplicate" — not implemented
- Duplicating a table (with its field config) is a common schema-building workflow

### 12. Dark Mode
- The right panel is already dark; extend that to the whole app as an option
- The design tokens are already defined in ui_redesign.md

---

## UX Changes

### 1. Onboarding / Empty State Guidance
- Right now a new user lands on a blank schema page with no direction
- An interactive 3-step wizard ("Create schema → Seed → Query") with a demo database pre-populated
- Alternatively, an inline "Start here" banner with one-click template loading

### 2. Validation Feedback Before Creating DB
- Show inline errors on the schema form before the user hits "Create Database":
  - Duplicate table names, empty table/field names, missing PK, FK pointing to non-existent table
- Currently errors only surface after the PostgreSQL call fails

### 3. Progress Indicator Across Pages
- A persistent top bar showing "Step 1: Schema ✓ → Step 2: Seed → Step 3: Query → Step 4: Charts"
- Makes the linear workflow explicit

### 4. Inline Preview in Seeds (No Modal)
- Replace the "Preview" modal with an inline expanded row
- Shows a mini table of 3 sample rows directly under the seed card without breaking context

### 5. Query Results Pinning
- After running a query, results disappear when you modify the SQL
- "Pin results" toggle that keeps the last result set visible alongside the new SQL

### 6. Keyboard Shortcuts
- `Ctrl+Enter` to run query, `Ctrl+S` to save, `Ctrl+D` to duplicate
- Muscle-memory for anyone coming from DBeaver, DataGrip, etc.

### 7. Seed SQL Preview Truncation
- Cap preview at first 5 rows per table with a "... and N more rows" indicator
- 500 rows = ~10,000 lines in the SQL panel currently

### 8. Database Status on Sidebar
- Show the currently-loaded database name as a small badge/pill in the sidebar
- Users frequently lose track of which database is active when switching pages

### 9. Collapsible Table Cards in Schema
- When you have 6+ tables, the schema page becomes very tall
- Add collapse/expand per-table card

### 10. Toast Positioning + Persistence
- Move toasts to bottom-left (top-right conflicts with the DB selector and sidebar on smaller screens)
- Add an "undo" action on the toast for destructive actions
