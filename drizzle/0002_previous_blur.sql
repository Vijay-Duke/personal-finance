CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY DEFAULT 'instance' NOT NULL,
	`instance_name` text DEFAULT 'Zen Finance' NOT NULL,
	`registration_enabled` integer DEFAULT true NOT NULL,
	`setup_completed` integer DEFAULT false NOT NULL,
	`max_households` integer DEFAULT 1 NOT NULL,
	`max_users_per_household` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `household_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`code` text NOT NULL,
	`created_by` text NOT NULL,
	`assigned_role` text DEFAULT 'member' NOT NULL,
	`expires_at` integer,
	`max_uses` integer DEFAULT 1 NOT NULL,
	`use_count` integer DEFAULT 0 NOT NULL,
	`revoked_at` integer,
	`revoked_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`revoked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `household_invites_code_unique` ON `household_invites` (`code`);--> statement-breakpoint
CREATE TABLE `invite_usages` (
	`id` text PRIMARY KEY NOT NULL,
	`invite_id` text NOT NULL,
	`used_by` text NOT NULL,
	`used_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`invite_id`) REFERENCES `household_invites`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`used_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `households` ADD `is_active` integer DEFAULT true NOT NULL;