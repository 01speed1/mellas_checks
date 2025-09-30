Infrastructure And Operations Instructions

Scope
Defines deployment architecture, environment variables, operational practices, migration path from direct DB access to backend API, and security controls. Complements business.instructions.md (domain) and project.instructions.md (technical guidelines). API structure specifics live in api.instructions.md.

High Level Architecture
Frontend: Vite React static site on Render Static Site. All data via REST calls. No database tokens, no direct SQL.
Backend API: Fastify service on Render Web Service. Implements domain logic (schedule snapshot, checklist expansion, phase calculation). Exposes versioned base path /api/v1/.
Database: Turso (libSQL). Single auth token stored only in backend environment variables. Read/write via repository layer. No client exposure.
Time Zone Source: Environment variable SCHOOL_TIMEZONE governs phase logic. All target dates computed relative to backend local time using this timezone.

Backend Folder Structure
server/
	src/
		index.ts
		config/env.ts
		db/client.ts
		lib/time-phase.ts
		repositories/
			children-repository.ts
			templates-repository.ts
			schedule-repository.ts
			checklist-repository.ts
		services/
			phase-service.ts
			schedule-service.ts
			checklist-service.ts
		routes/
			children-routes.ts
			templates-routes.ts
			phase-routes.ts
			checklist-routes.ts
		schemas/ (optional)
			checklist.ts
	package.json

Layer Responsibilities
config: Load and validate environment variables.
db: Turso client singleton.
repositories: SQL queries and row mapping only.
services: Business invariants (snapshot immutability, unique checklist instance, phase gating, reselect rules) and composition of repositories.
routes: Fastify handlers translating HTTP to service calls and formatting responses.
lib: Cross-cutting utilities (time-phase only initially).
schemas: Optional runtime validation (e.g. Joi) for request bodies and responses.

API Versioning
All endpoints mounted under /api/v1/. Future breaking changes create /api/v2/ while preserving v1 until deprecation window ends.

Environment Variables
Frontend (public build time):
	VITE_API_BASE_URL  Backend base URL including /api/v1 (example: https://mellas-api.onrender.com/api/v1)

Backend (private):
	TURSO_DATABASE_URL
	TURSO_AUTH_TOKEN
	SCHOOL_TIMEZONE (example: America/Mexico_City)
	ALLOWED_ORIGIN (exact frontend origin)
	API_KEY (optional shared secret header x-internal-key)
	LOG_LEVEL (default info)
	PORT (injected by Render)

Deprecated (must not appear in code or build artifacts):
	VITE_TURSO_DATABASE_URL
	VITE_TURSO_AUTH_TOKEN

Token Rotation Procedure
1 Generate new Turso token.
2 Add new token as TURSO_AUTH_TOKEN in backend service env (keep old token active temporarily).
3 Re-deploy backend and confirm connectivity (health endpoint or simple query route).
4 Revoke old token in Turso dashboard.
5 Remove any local references to old token and redeploy.
6 Verify repository contains no occurrences of old token fragment (search) and no deprecated variable names.

Security Controls (Initial Phase)
Transport: HTTPS handled by Render.
CORS: Restrict to ALLOWED_ORIGIN exact match.
Secret Handling: Only backend holds database credentials.
Input Validation: Basic type validation for mutation endpoints. Harden with schemas as needed.
Rate Limiting: Apply global modest rate limit and stricter limit for toggle endpoints to reduce abuse.
Data Leakage Prevention: Do not return internal snapshot identifiers (scheduleVersionId). Checklist responses expose only template and material level IDs required by frontend.
Optional API Key: If API_KEY is set, require x-internal-key header match for all POST endpoints.
Logging: Structured JSON lines at info level for major events (ensureChecklist, toggleItem, reselectTemplate) with timestamp and minimal identifiers.
No Persistent Lock Flag: Phase logic computed dynamically; never store a locked boolean.

Phase Logic Centralization
Single utility lib/time-phase.ts computes phase given current time and target date. Services call it before permitting mutations. Frontend consumes phase via /phase endpoint; does not replicate logic.

Initial Endpoint Set
GET /api/v1/children
GET /api/v1/children/:childId/templates
GET /api/v1/phase?childId=optional
POST /api/v1/checklist/ensure { childId, templateId }
POST /api/v1/checklist/reselect { childId, templateId }
GET /api/v1/checklist?childId=...
POST /api/v1/checklist/item/toggle { checklistItemId, checked }
GET /api/v1/checklist/summary?childId=... (optional optimization)
GET /api/v1/health (internal health readiness)

Checklist Payload Contract
checklistInstanceId: string
targetDateISO: string
phase: string
editable: boolean
template: { id, name }
subjects: [ { subjectId, subjectName, hasMaterials, materials: [ { checklistItemId, materialId, materialName, checked, checkedAt? } ] } ]
aggregates: { total, checked, allReady }

Migration Plan (Legacy Direct Access To API)
1 Scaffold server folder and minimal Fastify app with health route.
2 Add Turso client singleton and run basic connectivity check.
3 Implement children and phase endpoints, deploy backend.
4 Implement ensure and get checklist endpoints with snapshot logic.
5 Implement toggle and reselect endpoints.
6 Introduce frontend API client (fetch wrapper) and feature flag consumption via presence of VITE_API_BASE_URL.
7 Migrate useChecklist to backend responses while retaining legacy fallback temporarily.
8 Remove legacy direct DB logic and any Turso references in frontend.
9 Rotate Turso token following rotation procedure.
10 Remove fallback flag and purge deprecated env names.
11 Verify bundle produced contains no deprecated variables or secret fragments.

Operational Runbook (Common Tasks)
Add Child: Use admin UI (future) or direct SQL migration; endpoint for creation can be added later (/admin scope) not in initial public set.
Schema Change: Create new SQL migration file, apply via deployment pipeline before deploying backend code depending on new columns.
Incident (DB Unreachable): Backend returns 503 on critical repository failures; frontend displays transient error and retries with exponential backoff.
Log Review: Use Render logs; search event field values (ensureChecklist, toggleItem) for audit overview.

Error Handling Pattern
Repositories throw errors with minimal context.
Services map domain conflicts (e.g. reselect after lock) to standardized error shapes { error: code, message }.
Routes set appropriate HTTP status: 400 validation, 403 phase locked, 404 not found (child, template), 409 conflict (duplicate ensure scenario), 500 internal.

Performance Considerations
Checklist expansion done once per ensure or reselect; subsequent GET checklist returns stored rows not regenerated.
Material toggle uses single UPDATE with returning clause to avoid extra SELECT round trip.
Aggregate counts maintained via lightweight SELECT COUNT(*) queries or computed in memory from loaded rows. Acceptable given small dataset size.

Logging Event Shape Example
{ event: toggleItem, checklistItemId, childId, checked: true, timestamp }

Monitoring And Future Enhancements (Not Implemented Yet)
Add structured metrics (count toggles, time to readiness) stored in separate analytics table.
Add API key rotation automation.
Add stale schedule template detection for upcoming day.

Prohibited Operational Practices
Exposing Turso credentials in frontend build.
Bypassing services with ad hoc SQL in route handlers.
Embedding scheduleVersionId in any client payload.
Adding a persistent locked flag column.

Review Cadence
Revisit this document when adding new domain entities, introducing authentication, or changing phase window definitions. Keep api.instructions.md aligned when endpoints evolve.

End Of Infrastructure Instructions
