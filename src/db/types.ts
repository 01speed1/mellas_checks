import { InferModel } from 'drizzle-orm';
import {
  child,
  subject,
  material,
  subjectMaterial,
  scheduleTemplate,
  scheduleVersion,
  scheduleBlock,
  checklistInstance,
  checklistItemState,
  auditEvent,
  subjectRequirement,
} from './schema';

export type Child = InferModel<typeof child, 'select'>;
export type NewChild = InferModel<typeof child, 'insert'>;

export type Subject = InferModel<typeof subject, 'select'>;
export type NewSubject = InferModel<typeof subject, 'insert'>;

export type Material = InferModel<typeof material, 'select'>;
export type NewMaterial = InferModel<typeof material, 'insert'>;

export type SubjectMaterial = InferModel<typeof subjectMaterial, 'select'>;
export type NewSubjectMaterial = InferModel<typeof subjectMaterial, 'insert'>;

export type ScheduleTemplate = InferModel<typeof scheduleTemplate, 'select'>;
export type NewScheduleTemplate = InferModel<typeof scheduleTemplate, 'insert'>;

export type ScheduleVersion = InferModel<typeof scheduleVersion, 'select'>;
export type NewScheduleVersion = InferModel<typeof scheduleVersion, 'insert'>;

export type ScheduleBlock = InferModel<typeof scheduleBlock, 'select'>;
export type NewScheduleBlock = InferModel<typeof scheduleBlock, 'insert'>;

export type ChecklistInstance = InferModel<typeof checklistInstance, 'select'>;
export type NewChecklistInstance = InferModel<typeof checklistInstance, 'insert'>;

export type ChecklistItemState = InferModel<typeof checklistItemState, 'select'>;
export type NewChecklistItemState = InferModel<typeof checklistItemState, 'insert'>;

export type AuditEvent = InferModel<typeof auditEvent, 'select'>;
export type NewAuditEvent = InferModel<typeof auditEvent, 'insert'>;

export type SubjectRequirement = InferModel<typeof subjectRequirement, 'select'>;
export type NewSubjectRequirement = InferModel<typeof subjectRequirement, 'insert'>;
