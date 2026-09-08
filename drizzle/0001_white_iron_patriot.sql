CREATE TABLE `rdrs_activity_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`hostId` int NOT NULL,
	`profileId` int NOT NULL,
	`source` enum('agent','simulation') NOT NULL,
	`correlationId` varchar(128) NOT NULL,
	`eventType` enum('create','modify','rename','delete') NOT NULL,
	`filePath` text NOT NULL,
	`oldExtension` varchar(32),
	`newExtension` varchar(32),
	`fileSize` int,
	`processName` varchar(160),
	`isProtectedPath` boolean NOT NULL DEFAULT false,
	`occurredAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rdrs_activity_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rdrs_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`actorId` int NOT NULL,
	`entityType` varchar(60) NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(80) NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rdrs_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rdrs_hosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`hostKey` varchar(128) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`platform` varchar(80) NOT NULL,
	`agentVersion` varchar(40),
	`status` enum('online','offline','paused') NOT NULL DEFAULT 'offline',
	`lastHeartbeatAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rdrs_hosts_id` PRIMARY KEY(`id`),
	CONSTRAINT `rdrs_hosts_hostKey_unique` UNIQUE(`hostKey`)
);
--> statement-breakpoint
CREATE TABLE `rdrs_incident_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`eventId` int NOT NULL,
	`signal` varchar(120) NOT NULL,
	`contribution` int NOT NULL,
	`details` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rdrs_incident_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rdrs_incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`hostId` int NOT NULL,
	`profileId` int NOT NULL,
	`correlationId` varchar(128) NOT NULL,
	`source` enum('agent','simulation') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`status` enum('open','acknowledged','assigned','escalated','resolved','false_positive') NOT NULL DEFAULT 'open',
	`riskScore` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`explanation` text NOT NULL,
	`affectedEventCount` int NOT NULL DEFAULT 0,
	`assignedTo` int,
	`firstObservedAt` timestamp NOT NULL,
	`lastObservedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rdrs_incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rdrs_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`hostId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`testFolder` text NOT NULL,
	`quarantineDirectory` text NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`riskThreshold` int NOT NULL DEFAULT 65,
	`protectedImpactWeight` int NOT NULL DEFAULT 25,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rdrs_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rdrs_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`incidentId` int NOT NULL,
	`format` enum('json','markdown','csv') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rdrs_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rdrs_response_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`actorId` int NOT NULL,
	`action` varchar(80) NOT NULL,
	`note` text,
	`targetPath` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rdrs_response_actions_id` PRIMARY KEY(`id`)
);
