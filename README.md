# WebTree

A **TreeSheets**-style hierarchical spreadsheet for the web, styled as a
Palantir-Gotham-flavored intelligence console, and ready to deploy on **Railway**.

Every cell can hold **Markdown**, an image, a style — _or an entire grid of its
own_, recursively. Zoom into any cell to make it the root, fold branches you
don't need, and edit whole sub-trees as Markdown. Documents autosave to Postgres
and live at a shareable link (no login).

> Inspired by [aardappel/treesheets](https://github.com/aardappel/treesheets).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — Gotham theme tokens
- **Prisma 6** + **PostgreSQL**
- **Zustand** + **immer** + **zundo** — state & undo/redo
- **react-markdown** + **remark-gfm** — cell rendering
- Deployable via **Dockerfile** + `railway.json`

## Features

- **Infinite nesting** — a document is a grid; any cell can contain a sub-grid.
- **Markdown-native cells** — render Markdown when idle, edit raw on focus.
- **Edit branches as Markdown** — the Markdown panel serializes the current view
  to a nested outline / GFM table and re-parses your edits back into the tree.
- **Zoom & fold** — `Ctrl+]` to dive into a cell, fold to collapse sub-grids.
- **Cell styling** — fill, ink, bold / italic / strikethrough.
- **Images** — paste/upload; downscaled client-side and stored inline.
- **Import / Export** — JSON, Markdown, CSV, HTML.
- **Undo / redo**, **autosave**, **shareable links**.

## Quick start (local)

Requires Node 22+ and Docker (for Postgres).

```bash
cp .env.example .env          # DATABASE_URL points at the compose Postgres
docker compose up -d db       # start Postgres
npm install
npm run db:migrate            # create the schema (first run: name it "init")
npm run dev                   # http://localhost:3000
```

Open the app, hit **New document**, and start nesting.

## Keyboard

| Keys | Action |
| --- | --- |
| `↑ ↓ ← →` | Move selection (Up on the top row ascends to the parent) |
| `Enter` / `F2` / double-click | Edit cell Markdown |
| _any printable key_ | Start editing (replaces cell) |
| `Esc` | Stop editing / zoom out |
| `Tab` / `Shift+Tab` | Next / previous cell |
| `Insert` / `Ctrl+Enter` | Add a sub-grid to the selected cell |
| `Ctrl+]` / `Ctrl+[` | Zoom into / out of a cell |
| `Ctrl+B` / `Ctrl+I` | Bold / italic |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / redo |
| `Delete` / `Backspace` | Clear cell text |

## Markdown mapping

The Markdown panel and import/export use a canonical mapping:

- A **leaf table** (a grid with >1 column whose cells have no sub-grids) ⇄ a
  **GFM table**.
- Every other grid ⇄ a **nested bullet list**: one bullet per cell, a cell's
  sub-grid nested beneath it. Headings (`#`, `##`, …) import as nesting levels.

Single-column outlines and leaf tables round-trip losslessly. A grid that is
both multi-column _and_ nested normalizes to an outline on re-import.

## Deploy to Railway

1. Push this repo to GitHub and create a Railway project **from the repo**.
   Railway reads `railway.json` and builds with the `Dockerfile`.
2. Add a **PostgreSQL** database to the project (New → Database → PostgreSQL).
3. On the web service, set the `DATABASE_URL` variable to reference the database:

   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

4. Deploy. The `preDeployCommand` runs `prisma migrate deploy` (applying
   `prisma/migrations`); the service then boots Next.js. Healthcheck: `/api/health`.

That's it — open the generated domain and create a document.

> Images are stored inline as downscaled data URLs inside the document JSON, so
> no object storage is required for v1.

### Port / start command

Next.js binds to Railway's injected `PORT` automatically, so the start command
is just `npx next start -H 0.0.0.0` — **do not** add `-p ${PORT:-3000}`. Railway
runs the start command without a shell, so `${PORT:-3000}` is passed to Next
verbatim and fails with:

```
error: option '-p, --port <port>' argument '${PORT:-3000}' is invalid.
```

If you hit that, clear any **Custom Start Command** in the service settings (so
`railway.json` is used) or set it to `npm start`.

## Project layout

```
src/app/            routes: / , /d/[id] , /api/{docs,health}
src/components/      CommandBar, Sheet (Grid/Cell), Inspector, MarkdownPanel, Editor
src/store/          Zustand store (useDoc) + autosave
src/lib/tree/       data model, grid operations, sample doc
src/lib/markdown/   tree <-> markdown serialize / parse
src/lib/            db client, image downscale, export helpers
prisma/             schema + migrations
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Start the production server |
| `npm test` | Unit tests (Vitest) |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:deploy` | Apply migrations (CI/prod) |
