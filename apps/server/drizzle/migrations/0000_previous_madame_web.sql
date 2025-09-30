CREATE TABLE `audit_event` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `event_type` text NOT NULL,
    `child_id` integer,
    `checklist_instance_id` integer,
    `payload_json` text,
    `created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
    FOREIGN KEY (`child_id`) REFERENCES `child` (`id`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (`checklist_instance_id`) REFERENCES `checklist_instance` (`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `checklist_instance` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `child_id` integer NOT NULL,
    `target_date` text NOT NULL,
    `schedule_version_id` integer NOT NULL,
    `created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
    `updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
    FOREIGN KEY (`child_id`) REFERENCES `child` (`id`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (`schedule_version_id`) REFERENCES `schedule_version` (`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_checklist_instance_child_date` ON `checklist_instance` (`child_id`, `target_date`);
--> statement-breakpoint
CREATE TABLE `checklist_item_state` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `checklist_instance_id` integer NOT NULL,
    `subject_id` integer NOT NULL,
    `material_id` integer NOT NULL,
    `is_checked` integer DEFAULT false NOT NULL,
    `checked_at` text,
    `created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
    `updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
    FOREIGN KEY (`checklist_instance_id`) REFERENCES `checklist_instance` (`id`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (`subject_id`) REFERENCES `subject` (`id`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (`material_id`) REFERENCES `material` (`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_checklist_item_unique` ON `checklist_item_state` (
    `checklist_instance_id`,
    `subject_id`,
    `material_id`
);
--> statement-breakpoint
CREATE TABLE `child` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `name` text NOT NULL,
    `created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
    `updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `child_name_unique` ON `child` (`name`);
--> statement-breakpoint
CREATE TABLE `material` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `name` text NOT NULL,
    `created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
    `updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `material_name_unique` ON `material` (`name`);
--> statement-breakpoint
CREATE TABLE `schedule_block` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`version_id` integer NOT NULL,
	`block_order` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP` NOT NULL,
	FOREIGN KEY (`version_id`) REFERENCES `schedule_version`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schedule_template` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`child_id` integer NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_schedule_template_child_name` ON `schedule_template` (`child_id`,`name`);--> statement-breakpoint
CREATE TABLE `schedule_version` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`valid_from` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `schedule_template`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subject` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subject_name_unique` ON `subject` (`name`);--> statement-breakpoint
CREATE TABLE `subject_requirement` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_id` integer NOT NULL,
	`description` text NOT NULL,
	`target_date` text,
	`is_recurring` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`resolved_at` text,
	FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `template_subject_material` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`material_id` integer NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `schedule_template`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`material_id`) REFERENCES `material`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_template_subject_material_unique` ON `template_subject_material` (`template_id`,`subject_id`,`material_id`);