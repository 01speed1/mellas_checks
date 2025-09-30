---
applyTo: '**'
---

Provide technical project context and coding guidelines. Business domain logic and functional rules are maintained separately in business.instructions.md and must be consulted alongside this file before implementing features.
\n+Project Name: mellas_checks
Primary Goal: Mobile‑first web application for two sisters to prepare for the next school day by selecting the next day's schedule and completing a materials checklist inside an allowed time window.
Primary Stack:

Frontend:
React (latest) with React Router.
Build tool: Vite (React + TypeScript template) unless explicitly changed later.
Styling: 8bitcn UI library (https://www.8bitcn.com/docs) for consistent retro themed components. Tailwind CSS is permitted only a-s the utility layer required by 8bitcn provided components. No additional third-party global styling frameworks (Bootstrap, Material UI) are allowed. Hand authored utility proliferation should be avoided; prefer semantic class names in local CSS when a pattern is not covered by 8bitcn.
Custom CSS rules must live in standalone `.css` files (either `src/styles/` global or feature-local `styles/` folder) using class names; avoid large inline style objects except for ultra-local one-off layout tweaks. Keep each CSS file focused and small. Tailwind setup (config, base layer import) must remain minimal and only include what 8bitcn components depend on.

Backend API:
Fastify (Node 20+) service hosted separately. Provides all data access and domain logic endpoints. Frontend must never embed Turso credentials.
Layered structure: config, db client singleton, repositories, services (domain logic), routes, optional schemas.
Versioned base path /api/v1/ for forward compatibility.

Database:
Turso (libSQL). Access only from backend. Frontend performs fetch calls to API only.

State Management:
Prefer local component state and lightweight custom hooks. Introduce a global state library only with explicit approval.

Deployment:
Render Static Site: serves built frontend.
Render Web Service: Fastify API service.
Turso: managed database. Token scoped to required permissions and stored only in backend environment variables.
See infrastructure.instructions.md for operational details.

Language & Comment Rules (STRICT):

- All source code (identifiers, strings meant for internal use, commit messages) MUST be in English.
- No inline or block comments anywhere in code. This includes JSDoc, block comments, and trailing comments.
- Explanations, rationale, and documentation belong in markdown docs (e.g. README, /docs) not inside code files.

Naming Conventions:

- No single-letter variable, function, or parameter names (e.g. i, j, k) even in loops. Use descriptive names (e.g. indexCounter, scheduleIndex).
- No unexplained acronyms. Use full descriptive words (e.g. scheduleIdentifier instead of schedId or sch).
- React components: PascalCase (e.g. ScheduleSelector).
- Functions, variables, hooks: camelCase (e.g. loadTomorrowChecklist, useScheduleState).
- Constants: UPPER_SNAKE_CASE (e.g. ALLOWED_CHECK_WINDOW_START_MINUTES).
- Files: kebab-case for non-component utilities (e.g. schedule-service.ts) and PascalCase for React component files (e.g. ScheduleSelector.tsx).
- Avoid ambiguous generic names (data, info, item). Be explicit (scheduleDefinition, materialChecklistItem).

Prohibited Patterns:

- Any form of comment in code files.
- Dead code, unused variables, placeholder functions returning empty values unless clearly required by framework scaffolding.
- Abbreviated variable names or generic placeholders.
- Tight coupling between UI components and database access (no direct SQL queries inside React components).

Directory Structure (initial proposal):

```
root
	├─ src/
	│   ├─ app/                # App bootstrap (App.tsx, main.tsx)
	│   ├─ routes/             # Route element components + route config
	│   ├─ components/         # Reusable presentational components
	│   ├─ features/           # Feature folders (checklist, schedule, identity)
	│   │    └─ checklist/
	│   │         ├─ api/      # Data layer calls (abstract Turso)
	│   │         ├─ model/    # TypeScript types / schema mappers
	│   │         ├─ ui/       # Feature-specific components
	│   │         └─ state/    # Hooks or local state management
	│   ├─ lib/                # Cross-cutting utils (date/time, validation)
	│   ├─ db/                 # Turso client factory + migrations loader
	│   ├─ types/              # Global shared types
	│   ├─ config/             # Environment configuration loading
	│   └─ styles/             # Global styles / Tailwind setup if adopted
	├─ scripts/                # Automation (migrations, seeding) - TS/Node
	├─ migrations/             # SQL migration files (ordered)
	├─ docs/                   # Extended documentation
	└─ .env.example            # Environment variable template
```

Routing Guidelines:

- Centralize route definitions in a single route configuration file (e.g. `src/routes/index.tsx`).
- Use nested routes for layout boundaries.
- Page components focus on UI orchestration; data fetching belongs to feature layer hooks.

Data Layer Technical Principles:

Frontend:
No direct SQL or Turso client usage. Only uses fetch against the backend API. No VITE*TURSO*\* variables allowed.

Backend:
Single Turso client singleton module (libSQL) reused across repositories.
Repository modules contain SQL and map rows to typed domain objects.
Service layer enforces business invariants (snapshot immutability, unique checklist instance, time window logic) and composes repositories.
Routes remain thin, delegating to services and formatting responses.
Return JSON using camelCase keys and ISO 8601 timestamps.
Do not leak internal identifiers (e.g. scheduleVersionId) to clients.

Environment Variables:

Frontend (public):
`VITE_API_BASE_URL` Base URL for the backend API (e.g. https://mellas-api.onrender.com/api/v1).

Backend (private):
`TURSO_DATABASE_URL` Turso database URL.
`TURSO_AUTH_TOKEN` Turso auth token (rotated when moving credentials off frontend).
`SCHOOL_TIMEZONE` IANA timezone used for phase calculations (e.g. America/Mexico_City).
`ALLOWED_ORIGIN` Exact origin for CORS (frontend site URL).
`API_KEY` Optional shared secret header value (x-internal-key) when enabled.
`LOG_LEVEL` Optional Fastify log level (info by default).
`PORT` Provided by Render at runtime.

Deprecated (must not reappear in codebase):
`VITE_TURSO_DATABASE_URL`
`VITE_TURSO_AUTH_TOKEN`

`.env.example` must list only currently supported variables grouped by frontend/backend.

Database Reference:

- Entity semantics and lifecycle rules reside in business.instructions.md.
- Migrations use sequential numeric or timestamp prefixes (e.g. `001_init.sql`).

Testing Policy Override (Current Project Decision):

The product owner has decided that no unit or integration test suites will be implemented for this project at this stage. Do not introduce new automated tests unless this decision is explicitly reversed in a future instruction update. Focus effort on delivering and refining core checklist functionality and admin flows.

Error Handling:

- Fail fast in data layer with thrown errors; transform to user-friendly messages at UI boundary.
- Avoid silent catches.

Performance & Accessibility:

- Mobile-first layouts; prefer flex/grid minimal wrappers.
- Ensure tap targets >= 44px.
- Provide keyboard navigation (tab order) even if usage is mostly touch.

Security & Privacy:

Secrets only reside in backend environment (Render). Frontend never embeds database credentials. All data mutations occur through authenticated (or controlled) API routes. Avoid PII beyond first names already defined.

Version Control & Commits:

- Commit messages in English, present tense, concise: `Add schedule selection logic`, `Implement checklist window validation`.
- One logical concern per commit (avoid large multi-purpose commits).

Dependency Policy:

- Minimize dependencies; justify each addition (performance, DX, or business requirement).
- 8bitcn styling library is the approved UI layer. Do not add alternative global styling frameworks (Tailwind, Bootstrap, Material UI) without explicit approval.
- Do not add state management or date libraries without explicit approval. Use native Intl and `Temporal` (when available) or a minimal util layer for date logic.

Package Management:

- Required package manager: pnpm only. Do not use npm or yarn.
- Commit the `pnpm-lock.yaml` file.
- Use `pnpm install`, `pnpm add`, `pnpm remove` for dependency changes.
- Scripts are executed with `pnpm <script>` (example: `pnpm dev`).
- Do not commit `node_modules`.

Monorepo And pnpm Workspaces:

Goal: Host frontend and backend (server) in a single repository with clean dependency boundaries and reproducible installs.

Workspace Root:
Root `package.json` marked `private: true` and defines `workspaces` array.
Recommended layout:
root/
package.json (workspaces)
pnpm-lock.yaml
apps/
frontend/ (current React app moved here when refactor happens)
server/ (Fastify API)
shared/ (optional future shared utilities package)

Interim Phase:
Until frontend is moved, server/ can be added alongside existing root. Later migrate frontend into apps/frontend to align with standard layout. Document the migration in a commit message.

Workspace Rules:
Frontend must not import server code directly.
Server must not import frontend components.
Shared reusable pure utilities (date helpers, types) live in a dedicated workspace package (e.g. shared/) consumed via `workspace:*` version spec.
No deep relative imports that escape package boundaries (../../server/src). Use workspace dependency instead.

Dependency Management:
Shared dev tooling (eslint, prettier, typescript) installed at root when possible.
Runtime dependencies specific to a package declared in that package's own package.json.
Use `pnpm add <dep> --filter <package>` to scope additions.
Use `workspace:*` range for internal shared packages (example: `"@mellas/shared": "workspace:*"`).

Scripts Conventions:
frontend: dev, build, preview
server: dev (watch), build (tsc output), start (node dist/index.js)
Root convenience scripts can proxy: `"dev:frontend": "pnpm --filter frontend dev"`.

Common Commands:
Install all: `pnpm install`
Build all: `pnpm -r build`
Run only server: `pnpm --filter server dev`
Add dependency to server: `pnpm add fastify --filter server`
Update shared dependency everywhere: `pnpm up <name> -r`

TypeScript Coordination:
Prefer each package with its own tsconfig.json extending a root base tsconfig.base.json for consistent compiler options.
Do not reference source files across packages; import compiled output or leverage `composite` + `references` only if build orchestration becomes necessary.

Publishing And Versioning:
No external publishing required; workspace internal versions stay at 0.0.0 or private until a distribution need emerges.

CI / Deployment Considerations:
Backend deployment step installs root and runs `pnpm --filter server build` then starts server.
Frontend static deploy step runs `pnpm --filter frontend build` and serves resulting dist.
Avoid running full repo build when only one package changed (future optimization via filter on changed files).

Enforcement:
Periodically run `pnpm list --depth -1` inside each package to confirm absence of unintended duplicates.
Add lint rule or script to guard against relative path cross-package imports.

Migration Steps To Adopt Workspaces (Planned):
1 Add root workspaces config referencing existing root (frontend placeholder) and new server/.
2 Create server package with its own package.json.
3 Move frontend into apps/frontend when convenient; adjust build scripts and deployment paths.
4 Introduce shared package only when at least two packages require the same code.
5 Update .env.example sections per package.

Code Style:

- Use TypeScript strict mode.
- Prefer explicit return types for exported functions.
- No default exports except React pages/components designated as route elements.

Build & Tooling (proposed baseline):

- `eslint` + `@typescript-eslint` + style rules enforcing no unused vars and naming constraints.
- Consider a custom ESLint rule or configuration to forbid comments entirely.
- `prettier` for formatting with consistent settings (no semicolons preference left open until defined; default to semicolons ON for clarity).

AI Assistant Usage Rules:

- When generating code, never include comments.
- Provide self-describing identifiers.
- If ambiguous requirements arise, request clarification before introducing assumptions that affect schema or architecture.

Non-Negotiable Constraints Summary:

1. React + React Router frontend isolated from persistence.
2. Turso accessed only through backend service.
3. 100% English identifiers and commit messages.
4. Zero code comments of any form in source code.
5. Descriptive names (no single letters, no unexplained acronyms).
6. No reintroduction of direct DB access in frontend.

Cross Reference:
business.instructions.md domain rules
infrastructure.instructions.md operational and deployment rules
api.instructions.md API structure and endpoint governance

Reference:

- Always read business.instructions.md for domain invariants, window rules, checklist generation, and versioning behavior before modifying or adding features.

End of guidelines.
