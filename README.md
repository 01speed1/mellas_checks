# mellas_checks

Web application (mobile-first) so the kids can prepare everything needed for tomorrow by selecting the applicable schedule template and completing a materials checklist.

## Goal

Create a simple habit that reduces forgotten items. Each afternoon (from 15:00 local time) they select who they are, choose tomorrow's schedule template, and check the required materials. Editing stops at 07:00 of the target day. From 07:00 to 15:00 the checklist is read-only; at 15:00 a new cycle for the next day begins.

## Core user flow (MVP)

1. Select child identity.
2. Select schedule template for tomorrow (can re-select until 07:00 next day).
3. See generated checklist (ordered subjects + materials snapshot).
4. Toggle items to Ready within the editable window.
5. State persists automatically.

## Time window rules

- Always preparing only for tomorrow.
- Editable window: 15:00 previous day (D-1) up to 07:00 of target day (D) exclusive.
- Locked (read-only): 07:00–15:00 of D.
- New cycle: from 15:00 of D for D+1 selection.
- Re-selection of template allowed only while editable (before 07:00 of D).

## Key rules

- Each child has multiple reusable schedule templates (Normal, Workshop, etc.).
- A template defines ordered subjects; each subject has linked materials.
- Checklist items are derived: subjects (snapshot) × materials per subject at snapshot time.
- Snapshots (schedule versions) are internal, created automatically; admin never manages them directly.
- Dynamic locking: no persisted locked flag; state computed from local time.

## Tech stack

- Frontend: React + React Router + TypeScript (Vite)
- Backend: Fastify API (to be migrated into apps/server) exposing /api/v1
- Database: Turso (libSQL) via Drizzle ORM (access only through backend once migration completes)
- Styling: 8bitcn UI library; minimal local CSS modules when needed
- Code: zero comments, descriptive English identifiers

## Project structure (current)

Monorepo using pnpm workspaces. Frontend fully migrated to `apps/frontend`. Root `src/` removed.

```
apps/
  server/            # Fastify API service
  frontend/          # React + Vite application (mobile-first UI)
drizzle/             # Database migrations
scripts/             # Automation scripts
docs/                # Additional documentation
pnpm-workspace.yaml
```

## Checklist window logic

Central utility determines current phase (Prep, Locked, Next Cycle) and editability. No manual override stored.

## Roadmap (high-level)

1. Stabilize core admin (subjects, materials, templates, blocks).
2. Child flow: identity → template selection → checklist with persistence.
3. Template re-selection retention strategy (preserve intersection of subject-material pairs) [planned].
4. Integrate SubjectRequirement into derived checklist.
5. Add audit events (toggles, re-selections) for future analytics.
6. Light reporting dashboard (per child per date readiness).

## Data model summary

`docs/schema.dbml` mirrors `src/db/schema.ts` (authoritative). Key entities:

- Child
- ScheduleTemplate (admin-managed) / ScheduleVersion (auto snapshot)
- Subject / Material / SubjectMaterial
- ChecklistInstance / ChecklistItemState
- SubjectRequirement (pending integration into checklist)
- AuditEvent (future analytics)

## Environment variables

Frontend (.env):

```
VITE_API_BASE_URL=
```

Backend (.env for apps/server):

```
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
SCHOOL_TIMEZONE=America/Bogota
ALLOWED_ORIGIN=
API_KEY=
LOG_LEVEL=info
```

Deprecated (must not be reintroduced): VITE_TURSO_DATABASE_URL, VITE_TURSO_AUTH_TOKEN

## Release staging

- MVP: Identity selection, template selection, derived checklist, time-window enforcement.
- Next: Reselection state preservation, SubjectRequirement merge.
- Later: Historical read-only view, metrics (streaks), notifications.

## Contributing

Follow `.github/instructions/proyect.instructions.md`. Keep PRs small and focused.

## License

MIT

---

Siguiente tarea: Definir esquema detallado de base de datos y migraciones iniciales.

## Local development

Install dependencies:

```bash
pnpm install
```

Start frontend (apps/frontend):

```bash
pnpm --filter frontend dev
```

Start backend (apps/server):

```bash
pnpm --filter server dev
```

Build frontend:

```bash
pnpm --filter frontend build
```

Type check frontend:

```bash
pnpm --filter frontend typecheck
```

Build all packages:

```bash
pnpm -r build
```

Frontend dev URL: http://localhost:5173
API dev base URL: http://localhost:3000/api/v1

## Workspace scripts quick reference

```bash
pnpm --filter frontend dev       # Frontend dev
pnpm --filter server dev         # Backend dev
pnpm -r build                    # Build all
pnpm --filter frontend preview   # Preview frontend build
pnpm --filter frontend typecheck # Type check frontend
```

## SubjectRequirement (planned)

Future: merge per-subject requirements (one-off or recurring) into derived checklist. Not implemented yet.

```

```
