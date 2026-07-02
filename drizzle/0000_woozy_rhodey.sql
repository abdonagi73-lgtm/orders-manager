CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`logo_url` text,
	`currency` text DEFAULT 'USD' NOT NULL,
	`commission_rate` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`workerId` text DEFAULT '' NOT NULL,
	`vendor` text NOT NULL,
	`code` text NOT NULL,
	`category` text NOT NULL,
	`colors` text NOT NULL,
	`sizes` text NOT NULL,
	`price` real NOT NULL,
	`qty` integer DEFAULT 1 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`ownerNote` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` text NOT NULL,
	`photo` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`startDate` text NOT NULL,
	`workerId` text NOT NULL,
	`workerName` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`shippingCost` real DEFAULT 0 NOT NULL,
	`workerCommission` real DEFAULT 0 NOT NULL,
	`totalOrderCost` real DEFAULT 0 NOT NULL,
	`commissionPaid` integer DEFAULT false NOT NULL,
	`orderType` text DEFAULT 'store' NOT NULL,
	`createdAt` text NOT NULL,
	`closedAt` text DEFAULT '' NOT NULL,
	`itemCount` integer DEFAULT 0 NOT NULL,
	`totalValue` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`pin_hash` text NOT NULL,
	`role` text DEFAULT 'worker' NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`frequency_score` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
