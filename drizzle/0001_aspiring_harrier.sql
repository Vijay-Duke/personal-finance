CREATE TABLE `account_visibility_settings` (
	`account_id` text PRIMARY KEY NOT NULL,
	`restricted_access` integer DEFAULT false NOT NULL,
	`default_permission` text,
	`hide_from_net_worth` integer DEFAULT false NOT NULL,
	`updated_by` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `ai_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text DEFAULT 'New Conversation' NOT NULL,
	`messages` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ai_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`name` text NOT NULL,
	`provider` text NOT NULL,
	`base_url` text,
	`api_key` text,
	`model` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`key_hash` text NOT NULL,
	`display_key` text NOT NULL,
	`scope` text DEFAULT 'read' NOT NULL,
	`source` text DEFAULT 'web' NOT NULL,
	`last_used_at` integer,
	`request_count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `auth_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bank_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`bank_name` text,
	`account_number` text,
	`routing_number` text,
	`account_type` text DEFAULT 'checking' NOT NULL,
	`interest_rate` real DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_accounts_account_id_unique` ON `bank_accounts` (`account_id`);--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`category_id` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`period` text DEFAULT 'monthly' NOT NULL,
	`period_start` text,
	`rollover_enabled` integer DEFAULT false NOT NULL,
	`rollover_amount` real DEFAULT 0,
	`alert_threshold` real DEFAULT 80,
	`alert_enabled` integer DEFAULT true NOT NULL,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`icon` text,
	`color` text,
	`parent_id` text,
	`is_system` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `category_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`name` text NOT NULL,
	`match_type` text DEFAULT 'contains' NOT NULL,
	`match_field` text DEFAULT 'description' NOT NULL,
	`match_value` text NOT NULL,
	`case_sensitive` integer DEFAULT false NOT NULL,
	`account_id` text,
	`transaction_type` text,
	`category_id` text NOT NULL,
	`priority` integer DEFAULT 100 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`match_count` integer DEFAULT 0 NOT NULL,
	`last_matched_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `crypto_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`symbol` text NOT NULL,
	`name` text,
	`coingecko_id` text,
	`logo` text,
	`network` text,
	`holdings` real DEFAULT 0 NOT NULL,
	`avg_cost_basis` real DEFAULT 0 NOT NULL,
	`total_cost_basis` real DEFAULT 0 NOT NULL,
	`current_price` real DEFAULT 0,
	`price_updated_at` integer,
	`storage_type` text,
	`exchange_name` text,
	`wallet_address` text,
	`wallet_name` text,
	`is_staked` integer DEFAULT false,
	`staking_apy` real DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `crypto_assets_account_id_unique` ON `crypto_assets` (`account_id`);--> statement-breakpoint
CREATE TABLE `dashboard_layouts` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`user_id` text NOT NULL,
	`layout` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dashboard_layouts_user_unique` ON `dashboard_layouts` (`user_id`);--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`api_key` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`sync_frequency` text DEFAULT 'daily' NOT NULL,
	`last_sync_at` integer,
	`rate_limit_remaining` integer,
	`rate_limit_reset_at` integer,
	`last_error_at` integer,
	`last_error_message` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`from_currency` text NOT NULL,
	`to_currency` text NOT NULL,
	`rate` real NOT NULL,
	`date` integer NOT NULL,
	`source` text DEFAULT 'frankfurter' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `financial_projections` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`parameters` text NOT NULL,
	`results` text,
	`projection_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `goal_contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`amount` real NOT NULL,
	`date` integer NOT NULL,
	`account_id` text,
	`transaction_id` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'savings' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`start_date` integer,
	`target_date` integer,
	`completed_date` integer,
	`linked_account_ids` text,
	`monthly_contribution` real,
	`priority` integer DEFAULT 5 NOT NULL,
	`icon` text,
	`color` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `import_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`source` text NOT NULL,
	`file_name` text,
	`account_id` text,
	`total_rows` integer DEFAULT 0 NOT NULL,
	`imported_count` integer DEFAULT 0 NOT NULL,
	`skipped_count` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error_message` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `insurance_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`policy_number` text,
	`provider` text NOT NULL,
	`coverage_amount` real,
	`deductible` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`premium_amount` real NOT NULL,
	`premium_frequency` text DEFAULT 'monthly' NOT NULL,
	`next_premium_date` integer,
	`start_date` integer,
	`end_date` integer,
	`renewal_date` integer,
	`linked_asset_ids` text,
	`beneficiaries` text,
	`agent_name` text,
	`agent_phone` text,
	`agent_email` text,
	`notes` text,
	`document_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `monthly_analytics_rollups` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`month` text NOT NULL,
	`category_id` text,
	`total_income` real DEFAULT 0 NOT NULL,
	`total_expense` real DEFAULT 0 NOT NULL,
	`total_transfers` real DEFAULT 0 NOT NULL,
	`transaction_count` integer DEFAULT 0 NOT NULL,
	`unique_days_with_transactions` integer DEFAULT 0,
	`largest_transaction` real,
	`average_transaction_size` real,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `net_worth_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`date` integer NOT NULL,
	`total_assets` real NOT NULL,
	`total_liabilities` real NOT NULL,
	`net_worth` real NOT NULL,
	`breakdown` text NOT NULL,
	`primary_currency` text DEFAULT 'USD' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text DEFAULT 'system' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`read_at` integer,
	`link` text,
	`resource_type` text,
	`resource_id` text,
	`metadata` text,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recurring_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`account_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`description` text,
	`merchant` text,
	`category_id` text,
	`transfer_account_id` text,
	`frequency` text NOT NULL,
	`day_of_week` integer,
	`day_of_month` integer,
	`month` integer,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`next_occurrence` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`auto_create` integer DEFAULT false NOT NULL,
	`occurrence_count` integer DEFAULT 0 NOT NULL,
	`last_occurrence` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`transfer_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `stocks` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`symbol` text NOT NULL,
	`exchange` text,
	`security_name` text,
	`logo` text,
	`shares` real DEFAULT 0 NOT NULL,
	`avg_cost_basis` real DEFAULT 0 NOT NULL,
	`total_cost_basis` real DEFAULT 0 NOT NULL,
	`current_price` real DEFAULT 0,
	`price_updated_at` integer,
	`broker` text,
	`broker_account_id` text,
	`dividend_yield` real DEFAULT 0,
	`last_dividend_date` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stocks_account_id_unique` ON `stocks` (`account_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transaction_splits` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`amount` real NOT NULL,
	`category_id` text,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `transaction_tags` (
	`transaction_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `unique_transaction_tag_idx` ON `transaction_tags` (`transaction_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`account_id` text NOT NULL,
	`transfer_account_id` text,
	`linked_transaction_id` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'cleared' NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`date` integer NOT NULL,
	`description` text,
	`merchant` text,
	`merchant_category` text,
	`category_id` text,
	`notes` text,
	`reference` text,
	`import_batch_id` text,
	`external_id` text,
	`recurring_schedule_id` text,
	`location` text,
	`latitude` real,
	`longitude` real,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transfer_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `transaction_household_date_idx` ON `transactions` (`household_id`,`date`);--> statement-breakpoint
CREATE INDEX `transaction_account_date_idx` ON `transactions` (`account_id`,`date`);--> statement-breakpoint
CREATE INDEX `transaction_category_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `transaction_external_id_idx` ON `transactions` (`external_id`);--> statement-breakpoint
CREATE TABLE `user_account_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`permission` text DEFAULT 'viewer' NOT NULL,
	`granted_by` text,
	`granted_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer,
	`notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `valuation_history` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`date` text NOT NULL,
	`value` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`underlying_price` real,
	`quantity` real,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `valuation_account_date_idx` ON `valuation_history` (`account_id`,`date`);--> statement-breakpoint
CREATE INDEX `valuation_date_idx` ON `valuation_history` (`date`);--> statement-breakpoint
CREATE TABLE `business_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`asset_type` text NOT NULL,
	`business_name` text,
	`entity_type` text,
	`ein` text,
	`state_of_formation` text,
	`date_formed` integer,
	`industry` text,
	`ownership_percentage` real,
	`share_count` integer,
	`total_shares` integer,
	`share_class` text,
	`vesting_schedule` text,
	`fully_vested_date` integer,
	`purchase_price` real,
	`purchase_date` integer,
	`current_estimated_value` real,
	`last_valuation_date` integer,
	`valuation_method` text,
	`annual_revenue` real,
	`annual_profit` real,
	`last_distribution_date` integer,
	`last_distribution_amount` real,
	`annual_distributions` real,
	`asset_description` text,
	`serial_number` text,
	`useful_life_years` integer,
	`salvage_value` real,
	`depreciation_method` text,
	`contact_name` text,
	`contact_email` text,
	`contact_phone` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_assets_account_id_unique` ON `business_assets` (`account_id`);--> statement-breakpoint
CREATE TABLE `debts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`debt_type` text NOT NULL,
	`lender` text,
	`lender_account_number` text,
	`original_balance` real,
	`origination_date` integer,
	`interest_rate` real,
	`is_fixed_rate` integer DEFAULT true NOT NULL,
	`rate_adjustment_date` integer,
	`minimum_payment` real,
	`payment_frequency` text DEFAULT 'monthly',
	`payment_due_day` integer,
	`autopay_enabled` integer DEFAULT false,
	`term_months` integer,
	`maturity_date` integer,
	`credit_limit` real,
	`available_credit` real,
	`linked_property_id` text,
	`escrow_balance` real,
	`includes_escrow` integer DEFAULT false,
	`pmi_amount` real,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `debts_account_id_unique` ON `debts` (`account_id`);--> statement-breakpoint
CREATE TABLE `personal_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`asset_type` text NOT NULL,
	`make` text,
	`model` text,
	`year` integer,
	`serial_number` text,
	`condition` text,
	`description` text,
	`purchase_price` real,
	`purchase_date` integer,
	`current_estimated_value` real,
	`last_appraisal_date` integer,
	`last_appraisal_value` real,
	`depreciation_rate` real,
	`vehicle_type` text,
	`vin` text,
	`license_plate` text,
	`mileage` integer,
	`fuel_type` text,
	`is_insured` integer DEFAULT false,
	`insurance_provider` text,
	`insurance_policy_number` text,
	`insurance_premium` real,
	`insurance_coverage` real,
	`linked_loan_id` text,
	`location` text,
	`storage_notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `personal_assets_account_id_unique` ON `personal_assets` (`account_id`);--> statement-breakpoint
CREATE TABLE `real_estate_properties` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`property_type` text DEFAULT 'primary_residence' NOT NULL,
	`address` text,
	`city` text,
	`state` text,
	`postal_code` text,
	`country` text DEFAULT 'US',
	`square_footage` integer,
	`bedrooms` integer,
	`bathrooms` real,
	`year_built` integer,
	`lot_size` real,
	`purchase_price` real,
	`purchase_date` integer,
	`current_estimated_value` real,
	`last_appraisal_date` integer,
	`last_appraisal_value` real,
	`is_rental` integer DEFAULT false NOT NULL,
	`monthly_rent_income` real,
	`occupancy_rate` real,
	`annual_property_tax` real,
	`annual_insurance` real,
	`monthly_hoa` real,
	`annual_maintenance` real,
	`linked_mortgage_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `real_estate_properties_account_id_unique` ON `real_estate_properties` (`account_id`);--> statement-breakpoint
CREATE TABLE `superannuation_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`super_type` text NOT NULL,
	`fund_name` text,
	`fund_abn` text,
	`member_number` text,
	`beneficiary_name` text,
	`beneficiary_relationship` text,
	`employer_contribution_rate` real,
	`employee_contribution_rate` real,
	`salary_percentage` real,
	`contribution_frequency` text,
	`last_contribution_date` integer,
	`last_contribution_amount` real,
	`tax_free_component` real,
	`taxable_component` real,
	`pre_tax_balance` real,
	`post_tax_balance` real,
	`investment_option` text,
	`historical_return` real,
	`has_life_insurance` integer DEFAULT false,
	`life_insurance_cover` real,
	`has_tpd_insurance` integer DEFAULT false,
	`tpd_insurance_cover` real,
	`has_income_protection` integer DEFAULT false,
	`income_protection_cover` real,
	`preservation_age` integer,
	`access_date` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `superannuation_accounts_account_id_unique` ON `superannuation_accounts` (`account_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`current_balance` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_liquid` integer DEFAULT true NOT NULL,
	`include_in_net_worth` integer DEFAULT true NOT NULL,
	`expected_annual_return_rate` real DEFAULT 0,
	`icon` text,
	`color` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "household_id", "name", "type", "currency", "current_balance", "is_active", "is_liquid", "include_in_net_worth", "expected_annual_return_rate", "icon", "color", "sort_order", "notes", "created_at", "updated_at") SELECT "id", "household_id", "name", "type", "currency", "current_balance", "is_active", "is_liquid", "include_in_net_worth", "expected_annual_return_rate", "icon", "color", "sort_order", "notes", "created_at", "updated_at" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `users` ADD `two_factor_enabled` integer DEFAULT false NOT NULL;