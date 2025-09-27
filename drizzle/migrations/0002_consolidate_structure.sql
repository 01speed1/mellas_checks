-- Consolidated structural adjustments aligning schema.ts
-- Changes: remove schedule_version.valid_to, remove schedule_block.starts_at/ends_at, add unique index on (version_id, block_order), add checklist_instance target_date index
-- This migration assumes previous tables existed with legacy columns. If starting fresh, earlier migrations may already omit them.

PRAGMA foreign_keys = off;

-- Rebuild schedule_version without valid_to
CREATE TABLE IF NOT EXISTS schedule_version_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL REFERENCES schedule_template (id) ON DELETE CASCADE,
    valid_from TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO
    schedule_version_new (
        id,
        template_id,
        valid_from,
        created_at,
        updated_at
    )
SELECT
    id,
    template_id,
    valid_from,
    created_at,
    updated_at
FROM schedule_version;

DROP TABLE schedule_version;

ALTER TABLE schedule_version_new RENAME TO schedule_version;

CREATE INDEX IF NOT EXISTS idx_schedule_version_valid_from ON schedule_version (valid_from);

-- Rebuild schedule_block without starts_at/ends_at
CREATE TABLE IF NOT EXISTS schedule_block_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_id INTEGER NOT NULL REFERENCES schedule_version (id) ON DELETE CASCADE,
    block_order INTEGER NOT NULL,
    subject_id INTEGER NOT NULL REFERENCES subject (id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO
    schedule_block_new (
        id,
        version_id,
        block_order,
        subject_id,
        created_at,
        updated_at
    )
SELECT
    id,
    version_id,
    block_order,
    subject_id,
    created_at,
    updated_at
FROM schedule_block;

DROP TABLE schedule_block;

ALTER TABLE schedule_block_new RENAME TO schedule_block;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_block_version_order ON schedule_block (version_id, block_order);

-- Checklist instance target date index (idempotent)
CREATE INDEX IF NOT EXISTS idx_checklist_instance_target_date ON checklist_instance (target_date);

PRAGMA foreign_keys = on;