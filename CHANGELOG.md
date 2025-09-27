# Changelog (Domain + Schema Alignment)

## Unreleased

### Added

- SubjectRequirement entity (ad-hoc and recurring subject-specific reminders) with fields: subject_id, description, target_date (optional), is_recurring, resolved_at.
- AuditEvent table alignment (payload_json, optional child_id and checklist_instance_id).

### Changed (Domain Model)

- ScheduleVersion becomes an implicit snapshot: no admin UI exposure; created or cloned automatically when a child selects a template for tomorrow or when admin edits template for a new day.
- Locked checklist phase removed as persisted state; lock status now computed dynamically using local time windows.
- Time window refined: Editable from 15:00 previous day (D-1) through 06:59:59 of target day (D); Locked 07:00–14:59; Next cycle from 15:00 D for D+1.
- Template re-selection allowed until 07:00 of target date (rebuilds derived checklist items).

### Removed

- Persisted locked column (was never finalized in migrations usage; code no longer references it).

### Pending Decisions

- Whether to physically drop legacy columns not required by business logic (starts_at, ends_at on schedule_block; valid_to on schedule_version if perpetual open-ended snapshots suffice).
- Strategy for preserving checked states on template re-selection (current approach: regeneration may reset all states; alternative: retain intersection of unchanged subject-material pairs).

### Schema Divergences Observed

- schema.ts includes starts_at, ends_at on schedule_block; business rules currently ignore explicit time-of-day semantics for blocks.
- schema.ts retains valid_from / valid_to interval semantics while business spec treats snapshots as immutable versions keyed implicitly by creation date (valid_to optional may be unnecessary if each day uses the latest <= target date).
- docs/schema.dbml omits starts_at / ends_at to reflect simplified ordering-only semantics (diverges from schema.ts which still defines them).

### Recommendations (Proposed; not yet applied)

1. Remove starts_at and ends_at from schedule_block (migration: create new table or alter if supported; in SQLite requires table recreation) if no near-term plan for timed blocks.
2. Keep valid_from; evaluate deprecating valid_to after confirming no UI/logic depends on historical open ranges beyond snapshot day. If removed, snapshot retrieval changes to simple equality or latest prior <= date.
3. Add explicit unique index on schedule_block (version_id, block_order) in actual database schema to enforce ordering uniqueness (present in DBML but confirm in migrations).
4. Add index on checklist_instance.target_date (present in DBML) if query patterns include date filtering per child list (verify existing migrations).
5. Introduce lightweight audit insertion calls (toggle item, template re-selection) to populate audit_event for future analytics.
6. Add requirement resolution endpoint and integrate open recurring/punctual requirements into checklist generation (phase 2).

---

## Historical (Initial)

- Initial entities: Child, Subject, Material, SubjectMaterial, ScheduleTemplate, ScheduleVersion (manual management), ChecklistInstance, ChecklistItemState.
- Early draft included locked flag persistence (deprecated).
