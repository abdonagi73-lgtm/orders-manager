CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`type` text NOT NULL,
	`for_who` text NOT NULL,
	`worker_id` text NOT NULL,
	`worker_name` text NOT NULL,
	`order_id` text NOT NULL,
	`order_name` text NOT NULL,
	`item_id` text NOT NULL,
	`item_code` text NOT NULL,
	`message` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
