---
applyTo: '**'
---

Provide technical project context and coding guidelines. Business domain logic and functional rules are maintained separately in business.instructions.md and must be consulted alongside this file before implementing features.
\n+Project Name: mellas_checks
Primary Goal: Mobile‑first web application for two sisters to prepare for the next school day by selecting the next day's schedule and completing a materials checklist inside an allowed time window.
Primary Stack:

- Frontend: React (latest) with React Router.
- Build tool: Vite (React + TypeScript template) unless explicitly changed later.
  Styling: 8bitcn UI library (https://www.8bitcn.com/docs) for consistent retro themed components. Tailwind CSS is permitted only as the utility layer required by 8bitcn provided components. No additional third-party global styling frameworks (Bootstrap, Material UI) are allowed. Hand authored utility proliferation should be avoided; prefer semantic class names in local CSS when a pattern is not covered by 8bitcn.
  Custom CSS rules must live in standalone `.css` files (either `src/styles/` global or feature-local `styles/` folder) using class names; avoid large inline style objects except for ultra-local one-off layout tweaks. Keep each CSS file focused and small. Tailwind setup (config, base layer import) must remain minimal and only include what 8bitcn components depend on.
- State management: Prefer local component state and lightweight custom hooks. Introduce a library (e.g. Zustand) only if complexity grows (multi-page shared state + persistence) and after explicit approval.
- Database: Turso (libSQL). Accessed through a thin data layer abstraction. No direct SQL scattered through UI components.
- Deployment: To be defined (suggest Netlify / Vercel for frontend; Turso handles DB). Avoid deployment-specific code until environment strategy is confirmed.

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

- Use a single lightweight DB client module (libSQL via Turso) exposing prepared helpers.
- Provide repository functions only; forbid raw SQL in React components.
- All data functions return typed objects.

Environment Variables (proposed):

- `VITE_TURSO_DATABASE_URL`
- `VITE_TURSO_AUTH_TOKEN`
- Never commit real credentials; provide `.env.example` with placeholders.

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

- Do not store secrets client-side beyond Turso public auth token (if applicable). If secure backend needed later, introduce it explicitly.
- Avoid PII beyond first names already defined.

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

1. React + React Router.
2. Turso for data persistence.
3. 100% English identifiers & commits.
4. Zero code comments of any form.
5. Descriptive names (no single letters, no unexplained acronyms).

Reference:

- Always read business.instructions.md for domain invariants, window rules, checklist generation, and versioning behavior before modifying or adding features.

End of guidelines.
