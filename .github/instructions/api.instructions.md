API Structure And Governance

Scope
Defines rules for designing, implementing, and evolving the backend Fastify API. Complements infrastructure.instructions.md (deployment) and business.instructions.md (domain invariants).

Principles
Single responsibility per endpoint.
No domain logic in route handlers; delegate to services.
Stable contracts; additive evolution preferred over breaking changes.
Never leak internal identifiers (scheduleVersionId) to clients.
All timestamps ISO 8601 UTC (or timezone explicit) strings.
Consistent camelCase JSON keys.

Base Path And Versioning
All endpoints mounted under /api/v1/.
Breaking changes require new version path (/api/v2/) while leaving v1 operational during transition.
No silent contract changes (field removal, semantic drift) inside a version.

Layering
routes: Input parsing, response formatting, status codes.
services: Business invariants, orchestration, transactions.
repositories: SQL only, no branching business logic.
db: Turso client singleton.
lib: Cross-cutting utilities (time-phase, id generation if added later).

Naming Conventions
Use descriptive resource nouns (children, templates, checklist, phase).
Actions expressed via HTTP verb (ensure, reselect exceptions allowed as action sub-resources when semantic differs from simple create/update).
Path segments lowercase with hyphens avoided unless necessary (prefer single word). Query parameters in camelCase.

Content Types
All requests and responses JSON (application/json). No mixed content types.
Health endpoint may return text/plain for simplicity.

Authentication And Authorization
Phase 1: Open within trusted environment and CORS-locked origin.
Optional API key: Header x-internal-key must match environment variable API_KEY for all mutating endpoints when variable is set.
If API_KEY absent, endpoints operate without this header.

Idempotency And Safety
GET endpoints side-effect free.
POST /checklist/ensure becomes idempotent for same (childId, targetDate) returning existing instance if already created.
POST /checklist/reselect permitted only while editable; regenerates items according to current template selection request.
POST /checklist/item/toggle flips or sets state; client supplies desired checked boolean to avoid race.

Error Handling Standard
Error payload: { error: code, message }.
Codes (error field values):
validation_error
not_found
phase_locked
conflict
internal_error
HTTP Status Mapping:
400 validation_error
403 phase_locked
404 not_found
409 conflict
500 internal_error
Unhandled exceptions bubble to 500 with internal_error.

Validation Rules
Use lightweight runtime validation (schema library optional). Minimum checks:
childId, templateId, checklistItemId non-empty strings.
checked boolean when toggling.
Reject extra unexpected top-level properties to reduce silent contract drift.

Endpoints (Initial Set)
GET /api/v1/children
200 { children: [ { id, name } ] }

GET /api/v1/children/:childId/templates
200 { templates: [ { id, name } ] }

GET /api/v1/phase?childId=optional
200 { phase, editable, nowISO, targetDateISO }

POST /api/v1/checklist/ensure
Body { childId, templateId }
200 ChecklistPayload

POST /api/v1/checklist/reselect
Body { childId, templateId }
200 ChecklistPayload
403 phase_locked when locked

GET /api/v1/checklist?childId=...
200 ChecklistPayload
404 not_found if none ensured yet

POST /api/v1/checklist/item/toggle
Body { checklistItemId, checked }
200 { checklistItemId, checked, checkedAt, aggregates: { total, checked, allReady } }
403 phase_locked
404 not_found

GET /api/v1/checklist/summary?childId=...
200 { total, checked, allReady }
Optional optimization; can be omitted if payload size small.

GET /api/v1/health
200 ok (text) or { status: up }

ChecklistPayload Shape
{
checklistInstanceId: string
targetDateISO: string
phase: string
editable: boolean
template: { id: string, name: string }
subjects: [
{
subjectId: string
subjectName: string
hasMaterials: boolean
materials: [
{
checklistItemId: string
materialId: string
materialName: string
checked: boolean
checkedAt?: string
}
]
}
]
aggregates: { total: number, checked: number, allReady: boolean }
}

Internal Identifiers And Privacy
Do not expose scheduleVersionId or templateSubjectMaterial join identifiers. Translate internal keys to stable client-facing IDs.

Drizzle ORM Usage
All server data access must use Drizzle ORM query builder and schema types instead of ad hoc raw SQL once migration completes.
Repository modules import tables from a dedicated server schema file (apps/server/src/db/schema.ts) mirroring business entities.
Infer types using InferModel for select and insert shapes; never duplicate interface fields manually if schema already defines them.
Use composable query helpers (where, eq, and, inArray, orderBy) to keep queries readable.
Prefer returning minimal column sets required by the service rather than select \*.
Apply transactions only when snapshot + instance creation must be atomic (future toggle batching or reselect logic) otherwise keep simple.
Raw SQL allowed only for:
Batch inserts where builder would introduce excessive boilerplate.
Temporary migration gap before full refactor (must be short-lived and tracked with a TODO in documentation, not code comments).
Any remaining raw SQL must not leak direct table internals in responses and should be migrated in subsequent refactors.

Repository Conventions With Drizzle
Function names: verb + resource (listChildren, getChecklistInstance, createScheduleVersion).
No mixed concerns: one repository per aggregate root or closely related set (schedule, checklist, child, template).
Never throw raw database errors upward; allow exception but services transform to API error shape.
Ordering and limits enforced explicitly in repository; services should not reorder lists unless combining multiple sources.

Concurrency Considerations
Toggle operations rely on single row UPDATE with returning. If concurrent toggles occur, last write wins. Client always sends explicit desired checked state to reduce ambiguity.
Reselect during rapid toggling: service enforces phase and rebuild sequence atomically (transaction if multiple tables changed).

Phase Enforcement
All mutating routes call phase-service before proceeding. If locked return 403 phase_locked. No bypass exceptions.

Logging Requirements
Log one line per mutating request: { event, route, childId?, checklistItemId?, status, durationMs }.
No sensitive tokens in logs.

Pagination And Limits
Not required initial scope due to small dataset. If added later, use standard pattern: ?limit= & cursor=.

Deprecation Policy
Add new fields as optional then announce promotion to required. Never repurpose a field with new meaning inside same version.

Testing (Manual Phase)
Smoke checklist ensure, toggle, reselect, and phase lock boundaries across 06:59->07:00 and 14:59->15:00 transitions manually until automated tests are introduced.

Change Management Workflow
1 Propose endpoint change in PR description referencing this file.
2 Update api.instructions.md with new or modified endpoint.
3 Keep infrastructure.instruccions.md updated if operational impact (env var, scaling need) arises.
4 Merge only after reviewer confirms spec alignment.

Prohibited API Patterns
Overloading endpoints with unrelated actions.
Embedding raw SQL errors in responses.
Returning arrays at root without an object wrapper (except pure lists like children allowed but prefer object for extensibility).
Using query for actions that change server state.

Future Extensions (Not Implemented)
Authentication per child (PIN or token).
Audit trail endpoint for admin.
Bulk toggle endpoint.
Long polling or SSE for multi-device sync.

End Of API Instructions
