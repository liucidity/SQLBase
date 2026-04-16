# UI Redesign — Option 1: "Split Canvas"

## Philosophy

Two panels always visible side-by-side. Left = visual form inputs. Right = live-updating syntax-highlighted SQL (dark, matching the home page code block aesthetic). Experts can click into the SQL panel and edit it directly — changes reflect back into the form (bidirectional sync).

---

## Global Layout

- Existing sidebar navigation is preserved
- Each feature page splits into two panels:
  - **Left panel** (flex ~3): white/light surface, visual form inputs
  - **Right panel** (flex ~2): dark code block, live SQL preview
- Right panel uses the same dark styling as the home page code block:
  - Background: `#1e1e2e` (dark navy)
  - Syntax colors: indigo for keywords, teal for identifiers, orange for values
  - Font: monospace, matching `react-code-blocks` Monokai theme
- **Expert mode toggle** (top-right of right panel): flips it into a fully editable SQL editor — typing raw SQL reflects back into the left form

### Responsive Behavior
- **Desktop (>1024px):** Both panels visible side-by-side
- **Tablet (768–1024px):** Right SQL panel collapses to a drawer, toggled by a `</>` button in the top bar
- **Mobile (<768px):** Two tabs — "Build" and "SQL" — switch between panels; bottom tab bar

---

## Schema Page

### Left Panel — Visual Table Builder

- Tables render as white cards stacked vertically, each with:
  - Editable table name heading at top
  - Field rows (one per column)
  - `+ Add Field` dashed-border row always visible at the bottom — impossible to miss
  - `⋯` overflow menu per table: Duplicate, Delete
- `+ Add Table` renders as a large dashed-border card at the end of the table list

#### Field Row Layout (single horizontal row per field)
```
[ field name input ] [ type pill ] [ constraint chips ] [ ⋯ advanced ] [ × remove ]
```

- **Field name input:** plain text input, monospace font, placeholder `field_name`
- **Type pill selector:** clicking opens a visual icon grid popover (not a dropdown):
  ```
  123 INT     ## BIGINT    Aa VARCHAR   ¶ TEXT
  ✓ BOOLEAN   📅 DATE      ⏱ TIMESTAMP  🔑 UUID
  ∑ SERIAL    % DECIMAL    ...
  ```
  Selected type renders as a colored pill (e.g., indigo for numeric, teal for text, orange for date)
- **Constraint chips:** toggleable inline chips, no dropdowns:
  - `NOT NULL`  `UNIQUE`  `PK`  `FK →`
  - Active chip = filled indigo; inactive = outlined gray
  - Clicking `FK →` opens a small popover to select referenced table and column
- **`⋯ advanced` button:** expands an inline sub-row with:
  - Default value text input
  - VARCHAR length input (only shown when type is VARCHAR)
  - Check constraint text input

### Right Panel — Live SQL Preview

- Dark code block, always in sync with left panel
- Displays full `CREATE TABLE` SQL for all tables
- Syntax highlighting:
  - Keywords (`CREATE`, `TABLE`, `PRIMARY KEY`, etc.): indigo
  - Table/column names: teal
  - Types (`INT`, `VARCHAR`, etc.): light purple
  - Values/constraints: orange
- Copy button (`⎘`) in top-right corner of the panel
- Expert mode: panel becomes an editable `<textarea>` with same syntax highlighting — changes parse back to update the form state
- Buttons row below the code block:
  - `Copy Schema` — copies all SQL to clipboard
  - `View ERD` — opens ERD modal
  - `Save` — saves progress to backend
  - `Create Database` — executes schema SQL (primary CTA, full-width indigo button)

---

## Queries Page

### Left Panel — Query Builder

- Table selector at the top: horizontal scrollable list of table name chips (not a dropdown)
  - Clicking a chip adds that table to the query
  - Selected tables shown as filled indigo chips; click again to remove
- Selected columns section:
  - Column rows listed under each selected table header
  - Each row: `[column name chip]` `[aggregate dropdown: None/SUM/AVG/COUNT/MAX/MIN]` `[alias input]`
  - Drag handle on left side to reorder columns
- **WHERE** section (collapsible):
  - Condition rows: `[column select]` `[operator: = > < LIKE IN]` `[value input]`
  - `+ Add Condition` button, AND/OR toggle between conditions
- **ORDER BY** section (collapsible):
  - `[column select]` `[ASC/DESC toggle]`
- **LIMIT** input (inline, small text field at bottom)

### Right Panel — Live SQL + Results

- Dark code block showing live `SELECT` SQL in sync with the form
- `▶ Run Query` button at the top of the right panel (full-width, indigo)
  - Shows `CircularProgress` spinner while loading
- After running: results table appears below the code block
  - Scrollable, striped rows
  - Row count badge in header
  - Export to CSV button
- Copy button for SQL

---

## Seeds Page

### Left Panel — Seed Config

- Each table gets a card row:
  ```
  [ Table Name ]   [——○—— slider ——]   [ 50 ] rows   [ Preview ] [ Seed ]
  ```
  - Slider range: 1–1000 rows
  - Number input synced with slider
  - `Preview` button: shows one sample generated row inline below the table row (no modal)
    - Sample row displays as a mini table with column names and fake values
    - Click again to hide
  - Per-table `Seed` button (secondary)
- `Seed All Tables` primary CTA at the bottom of the panel (full-width indigo button)

### Right Panel — SQL Preview

- Shows all `INSERT INTO` statements (sample of first 3 rows per table)
- Same dark code block styling
- Updates live as row counts change
- Copy button for all seed SQL
- `Save` button below code block

---

## Queries Page (Charts Input)

_See Queries Page above — charts flow starts from running a query._

---

## Charts Page

### Layout

- Top section: SQL input area (same style as current, but with dark code block aesthetic)
  - `▶ Run Query` button
- After running: columns appear as draggable pills in a "Columns" tray
- Two chart cards side by side (or stacked on mobile):
  - **Bar Chart card** and **Pie Chart card**
  - Each card has labeled drop zones:
    - Bar: `X Axis ↓` and `Y Axis ↓` drop zones
    - Pie: `Label Key ↓` drop zone
  - Drag a column pill from the tray into a drop zone — no dropdowns
  - Chart renders live as columns are assigned
- Chart type switcher (icon buttons): `Bar` / `Pie` / (future: `Line`)

### Responsive
- On mobile: chart cards stack vertically, drop zones become select menus (tap to assign)

---

## My Databases Page

### Layout

- `+ New Database` button prominently at top right
- Database cards in a responsive grid (2-col desktop, 1-col mobile):
  - Database name (editable inline on double-click)
  - Created date (muted)
  - Status badge: `active` (green) or `inactive` (gray)
  - Two actions: `Load →` (primary, outlined indigo) and `Delete` (ghost red, icon only)
- Empty state: large centered illustration + "Create your first database" CTA

---

## Design Tokens (additions/changes)

```css
/* Code block panel */
--code-bg: #1e1e2e;
--code-keyword: #6366f1;     /* indigo — CREATE, TABLE, etc. */
--code-identifier: #5eead4;  /* teal — table/column names */
--code-type: #a78bfa;        /* light purple — INT, VARCHAR, etc. */
--code-value: #fb923c;       /* orange — literals, constraints */
--code-comment: #6b7280;     /* muted gray */

/* Type pill colors */
--type-numeric: #6366f1;     /* indigo */
--type-text: #0ea5e9;        /* sky blue */
--type-date: #f59e0b;        /* amber */
--type-bool: #10b981;        /* emerald */
--type-uuid: #8b5cf6;        /* violet */
```

---

## Key UX Principles for Implementation

1. **Always-visible SQL** — the right panel is never hidden by default on desktop; users learn SQL as they build
2. **No dropdowns for primary interactions** — types use icon grid popovers, constraints use chips, table selection uses chips; dropdowns only for secondary/advanced options
3. **Discoverable add affordances** — `+ Add Field` and `+ Add Table` use dashed borders (standard "add slot" pattern) so their purpose is immediately obvious
4. **Progressive disclosure** — basic field config (name + type + key constraints) is always visible; advanced options (default value, check constraints, VARCHAR length) are behind `⋯`
5. **Bidirectional expert mode** — SQL panel can be edited directly; the form reflects changes, so experts never feel limited
6. **Live feedback** — SQL updates on every keystroke/click; no "generate" or "preview" button needed for the code panel
