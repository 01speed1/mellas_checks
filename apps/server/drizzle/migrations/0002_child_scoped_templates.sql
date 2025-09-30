ALTER TABLE schedule_template
ADD COLUMN child_id integer REFERENCES child (id) ON DELETE cascade;

UPDATE schedule_template
SET
    child_id = (
        SELECT id
        FROM child
        WHERE
            name = 'Juanita Guerrero'
    )
WHERE
    name LIKE '%-A';

UPDATE schedule_template
SET
    child_id = (
        SELECT id
        FROM child
        WHERE
            name = 'Valentina Guerrero'
    )
WHERE
    name LIKE '%-B';

UPDATE schedule_template
SET
    child_id = (
        SELECT id
        FROM child
        ORDER BY id
        LIMIT 1
    )
WHERE
    child_id IS NULL;

CREATE TABLE schedule_template_new (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    child_id integer NOT NULL REFERENCES child (id) ON DELETE cascade,
    name text NOT NULL,
    created_at text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
    updated_at text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);

INSERT INTO
    schedule_template_new (
        id,
        child_id,
        name,
        created_at,
        updated_at
    )
SELECT
    id,
    child_id,
    name,
    created_at,
    updated_at
FROM schedule_template;

DROP TABLE schedule_template;

ALTER TABLE schedule_template_new RENAME TO schedule_template;

CREATE UNIQUE INDEX idx_schedule_template_child_name ON schedule_template (child_id, name);

CREATE TABLE template_subject_material (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    template_id integer NOT NULL REFERENCES schedule_template (id) ON DELETE cascade,
    subject_id integer NOT NULL REFERENCES subject (id) ON DELETE cascade,
    material_id integer NOT NULL REFERENCES material (id) ON DELETE cascade,
    created_at text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);

CREATE UNIQUE INDEX idx_template_subject_material_unique ON template_subject_material (
    template_id,
    subject_id,
    material_id
);

INSERT
    OR IGNORE INTO template_subject_material (
        template_id,
        subject_id,
        material_id
    )
SELECT st.id as template_id, sb.subject_id, sm.material_id
FROM
    schedule_template st
    JOIN schedule_version sv ON sv.template_id = st.id
    JOIN schedule_block sb ON sb.version_id = sv.id
    JOIN subject_material sm ON sm.subject_id = sb.subject_id;

DROP TABLE IF EXISTS subject_material;