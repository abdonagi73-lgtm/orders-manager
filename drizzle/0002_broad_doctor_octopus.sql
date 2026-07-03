CREATE TABLE `timeline` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`order_id` text NOT NULL,
	`order_name` text NOT NULL,
	`action` text NOT NULL,
	`by` text NOT NULL,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
