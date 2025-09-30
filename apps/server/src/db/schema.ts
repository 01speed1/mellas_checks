import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const child = sqliteTable('child', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const subject = sqliteTable('subject', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const material = sqliteTable('material', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const scheduleTemplate = sqliteTable('schedule_template', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  childId: integer('child_id')
    .notNull()
    .references(() => child.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const scheduleVersion = sqliteTable('schedule_version', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id')
    .notNull()
    .references(() => scheduleTemplate.id, { onDelete: 'cascade' }),
  validFrom: text('valid_from').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const scheduleBlock = sqliteTable('schedule_block', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  versionId: integer('version_id')
    .notNull()
    .references(() => scheduleVersion.id, { onDelete: 'cascade' }),
  blockOrder: integer('block_order').notNull(),
  subjectId: integer('subject_id')
    .notNull()
    .references(() => subject.id, { onDelete: 'no action' }),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const templateSubjectMaterial = sqliteTable('template_subject_material', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id')
    .notNull()
    .references(() => scheduleTemplate.id, { onDelete: 'cascade' }),
  subjectId: integer('subject_id')
    .notNull()
    .references(() => subject.id, { onDelete: 'cascade' }),
  materialId: integer('material_id')
    .notNull()
    .references(() => material.id, { onDelete: 'cascade' }),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const checklistInstance = sqliteTable('checklist_instance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  childId: integer('child_id')
    .notNull()
    .references(() => child.id, { onDelete: 'cascade' }),
  targetDate: text('target_date').notNull(),
  scheduleVersionId: integer('schedule_version_id')
    .notNull()
    .references(() => scheduleVersion.id),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const checklistItemState = sqliteTable('checklist_item_state', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checklistInstanceId: integer('checklist_instance_id')
    .notNull()
    .references(() => checklistInstance.id, { onDelete: 'cascade' }),
  subjectId: integer('subject_id')
    .notNull()
    .references(() => subject.id),
  materialId: integer('material_id')
    .notNull()
    .references(() => material.id),
  isChecked: integer('is_checked', { mode: 'boolean' }).default(false).notNull(),
  checkedAt: text('checked_at'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const subjectRequirement = sqliteTable('subject_requirement', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subjectId: integer('subject_id')
    .notNull()
    .references(() => subject.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  targetDate: text('target_date'),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  resolvedAt: text('resolved_at'),
});

export const auditEvent = sqliteTable('audit_event', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventType: text('event_type').notNull(),
  childId: integer('child_id').references(() => child.id, { onDelete: 'set null' }),
  checklistInstanceId: integer('checklist_instance_id').references(() => checklistInstance.id, {
    onDelete: 'set null',
  }),
  payloadJson: text('payload_json'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
