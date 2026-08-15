CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bulkWasteReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportedBy` int NOT NULL,
	`region` varchar(100) NOT NULL,
	`neighborhood` varchar(100) NOT NULL,
	`wasteType` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`latitude` varchar(32) NOT NULL,
	`longitude` varchar(32) NOT NULL,
	`dueAt` timestamp NOT NULL,
	`bulkWasteStatus` enum('bekliyor','toplandı') NOT NULL DEFAULT 'bekliyor',
	`collectedVehicleId` int,
	`collectedDriverId` int,
	`collectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulkWasteReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `citizenComplaints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportedBy` int NOT NULL,
	`region` varchar(100) NOT NULL,
	`neighborhood` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`latitude` varchar(32) NOT NULL,
	`longitude` varchar(32) NOT NULL,
	`photoUrl` text,
	`dueAt` timestamp NOT NULL,
	`complaintStatus` enum('açık','onaylandı') NOT NULL DEFAULT 'açık',
	`acknowledgedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledgedAt` timestamp,
	CONSTRAINT `citizenComplaints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `containerFaults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportedBy` int NOT NULL,
	`region` varchar(100) NOT NULL,
	`neighborhood` varchar(100) NOT NULL,
	`containerFaultType` enum('kol','ayak','gövde','kapak','diğer') NOT NULL,
	`description` text NOT NULL,
	`latitude` varchar(32) NOT NULL,
	`longitude` varchar(32) NOT NULL,
	`containerFaultStatus` enum('bekliyor','onarım_tamamlandı') NOT NULL DEFAULT 'bekliyor',
	`repairedBy` int,
	`repairNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`repairedAt` timestamp,
	CONSTRAINT `containerFaults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`region` varchar(100) NOT NULL,
	`neighborhood` varchar(100) NOT NULL,
	`vehicleType` enum('çöp kamyonu','damperli kamyon') NOT NULL,
	`startKm` int NOT NULL,
	`startFullness` enum('boş','dolu') NOT NULL,
	`endKm` int,
	`endFullness` enum('boş','dolu'),
	`tonnage` varchar(24),
	`tonnageReceiptUrl` text,
	`faultReported` boolean NOT NULL DEFAULT false,
	`shiftStatus` enum('açık','tamamlandı') NOT NULL DEFAULT 'açık',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicleFaults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`reportedBy` int NOT NULL,
	`description` text NOT NULL,
	`faultSeverity` enum('düşük','orta','yüksek') NOT NULL DEFAULT 'orta',
	`faultStatus` enum('kademe_onayı_bekliyor','bakımda','onaylandı') NOT NULL DEFAULT 'kademe_onayı_bekliyor',
	`approvedBy` int,
	`approvalNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	CONSTRAINT `vehicleFaults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleType` enum('çöp kamyonu','damperli kamyon') NOT NULL,
	`capacityTon` varchar(24) NOT NULL,
	`brand` varchar(100) NOT NULL,
	`plate` varchar(16) NOT NULL,
	`vehicleStatus` enum('aktif','arızalı','bakımda') NOT NULL DEFAULT 'aktif',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicles_plate_unique` UNIQUE(`plate`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('şoför','kademe personeli','kaynak personeli','yönetim') NOT NULL DEFAULT 'şoför';