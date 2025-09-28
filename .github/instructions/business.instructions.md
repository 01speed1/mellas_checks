---
applyTo: '**'
---

Business Domain And Functional Rules For mellas_checks

Purpose
Unified source of business logic truth for AI and contributors. Technical repo rules remain in project.instructions.md. This file covers what the application must do, independent of implementation details.

Core Domain Concepts
Child: A student using the checklist. Identified by unique name (first name) in current scope.
ScheduleTemplate: Child-scoped logical definition of an ordered list of subjects for a school day (e.g. Normal, Taller). Name uniqueness is enforced per child (same template name can exist for different children). Admin creates and edits templates only (no per-date configuration in admin UI).
ScheduleVersion: Internal snapshot auto-created only when a child commits a template for tomorrow. Never shown or selected in admin. Admin does not manage versions explicitly.
ScheduleBlock: An entry in a version that links to a subject and has an integer blockOrder. No time-of-day semantics in current iteration.
Subject: Academic or activity unit (Math, PE, Music).
Material: A physical or digital item needed (Notebook, Pencil Case, Gym Shoes).
TemplateSubjectMaterial: Association (many-to-many) between a specific template's inclusion of a subject and a material, allowing materials to differ for the same subject across different templates or children.
ChecklistInstance: A per child per targetDate container representing one preparation session for tomorrow. Only one per (childId, targetDate). The template used is implicit via the scheduleVersionId.
ChecklistItemState: A row representing the readiness state of a single required material derived from (ordered subjects in snapshot × materials linked to that subject at snapshot time).

Derived Checklist Expansion
Context: Child selects a template for tomorrow (target date is always implicit: current local date + 1 day).

1. Ensure or create schedule version snapshot V for that template and implicit date.
2. Enumerate ordered blocks.
3. For each block subject list its materials via TemplateSubjectMaterial for that template at snapshot time.
4. Build checklist items preserving subject order.
5. Persist or hydrate states.

User-Facing Flow (Children)

1. Identity Selection: Child picks their name from dynamic list persisted in DB. Store selected child id locally.
2. Template Selection For Tomorrow: Child selects one template for tomorrow. Snapshot is ensured automatically. If already selected, child may reselect a different template any time while the phase is editable (before 07:00 of target date). Reselection regenerates items (implementation: either replace states or rebuild unchecked items; current approach may be incremental and can evolve).
3. Checklist Display: Shows grouped subjects in snapshot order. Subjects without materials show No materials. Each subject row renders a nested material sub-checklist: every required material appears as an individual toggle directly under its subject (inline or expandable). Subject ordering follows blockOrder; material ordering is lexical by name unless an explicit ordering feature is added later.
4. Interaction Rules: Toggling allowed only in editable phases (see Time Window Rules). Each toggle persists immediately.
5. Completion Indicator: When all materials are checked show All ready state.
6. Post Lock: During locked phase checklist is read-only. After 15:00 of the target date a new cycle for the next day can begin.

Time Window Rules
All times local (device) time. D = target date (tomorrow relative to now when selecting).
Phases:

1. Prep Afternoon (previous day) starts at 15:00 of D-1 inclusive.
2. Prep Early (midnight to early morning) continues until 07:00 of D (exclusive).
3. Locked School Phase from 07:00 to 15:00 of D (exclusive end). Read-only.
4. Next Cycle starts 15:00 of D for D+1 selection.
   Template reselection allowed only while in a Prep phase (before 07:00 of D). Locking is purely time-derived (no stored flag).
   Single utility determines current phase and editability.

Invariants
Snapshot (scheduleVersion) immutable once created for a target date. Structural template edits affect only future snapshots. Subject ordering is preserved. Materials linkage is evaluated per template (not globally per subject) and the snapshot captures that per-template association. A checklist instance is uniquely identified by (childId, targetDate). Template identity is implicit through scheduleVersionId.

Persistence Contracts (Conceptual)
ChecklistInstance: { id, childId, targetDateISO, scheduleVersionId, createdAt } (unique on childId+targetDateISO). targetDateISO is always tomorrow at the time of selection.
ChecklistItemState: { id, checklistInstanceId, subjectId, materialId, checked, checkedAt?, updatedAt } unique on (checklistInstanceId, subjectId, materialId).
No modifications to an existing scheduleVersion; new future structure requires a fresh snapshot when next ensured.

Access Control Simplification
All logic assumes trusted local usage; no authentication boundaries yet. Future enhancement may introduce per-child PIN or lightweight auth.

Non-Goals (Current Iteration)
No multi-day planning beyond tomorrow. No manual version management. No partial template mixing. No per-child material overrides. No offline sync beyond local localStorage caching. No persisted locked flag.

Planned Future Extensions (Not Implemented Yet)
Progress analytics (e.g. streaks). Material-level reminders or notes. Export / print checklist. Multi-device synchronization. Admin reporting dashboard (per child, per date completion). Audit trail events (table present, logic deferred). Improved template reselection reconciliation strategy.

AI Usage Alignment
Never expose scheduleVersion identifiers in UI. Always derive checklist from ensured snapshot for target date. Centralize phase/time logic in one utility. Do not reintroduce persisted locking. Honor unique (childId, targetDate) semantics.

Acceptance Criteria For Checklist Feature Delivery
Select child -> select template -> auto ensure version for tomorrow -> view ordered subjects each with a nested per-subject material sub-checklist (or No materials if empty) -> toggle individual material readiness within allowed window -> states persist and hydrate correctly -> when all materials are checked across all subjects show All ready -> outside editable window the entire checklist becomes read-only. All without page errors, and with zero code comments per repository policy.

End Of Business Rules

Admin Capabilities (Reference)

1. Manage children (create, rename, delete).
2. Manage subjects (reusable across templates) and materials; link materials to a template's subjects (template-specific associations).
3. Manage schedule templates (create templates and order their subjects via blocks) without choosing dates or versions.
4. View (future extension) aggregated readiness states per child per date; versions remain hidden.

Clarifications

- Admin never selects a target date; the system always treats the child's preparation as for tomorrow.
- Re-selection before 07:00 rebuilds the checklist from the newly ensured snapshot.
- No persistent locked flag; locked state computed by time utility.
