-- ==============================================================================
-- Tepebaşı Belediyesi Temizlik İşleri Müdürlüğü
-- Veritabanı Kurulum ve Tablo Şema SQL Kodu (MySQL 8.0+ / MariaDB)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `tepebasi_temizlik` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tepebasi_temizlik`;

-- ------------------------------------------------------------------------------
-- 1. Kullanıcılar Tablosu (users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `openId` varchar(64) NOT NULL UNIQUE,
  `name` text DEFAULT NULL,
  `email` varchar(320) DEFAULT NULL,
  `loginMethod` varchar(64) DEFAULT NULL,
  `username` varchar(64) DEFAULT NULL UNIQUE,
  `passwordHash` varchar(255) DEFAULT NULL,
  `isLocalAccount` boolean NOT NULL DEFAULT false,
  `role` varchar(64) NOT NULL DEFAULT 'şoför',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Mahalleler Tablosu (neighborhoods)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `neighborhoods` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `region` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL UNIQUE,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Araçlar Tablosu (vehicles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `type` varchar(64) NOT NULL,
  `capacityTon` varchar(24) NOT NULL,
  `brand` varchar(100) NOT NULL,
  `plate` varchar(16) NOT NULL UNIQUE,
  `status` varchar(64) NOT NULL DEFAULT 'aktif',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Mesailer Tablosu (shifts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `shifts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `driverId` int NOT NULL,
  `vehicleId` int NOT NULL,
  `region` varchar(100) NOT NULL,
  `neighborhood` varchar(100) NOT NULL,
  `vehicleType` varchar(64) NOT NULL,
  `shiftHours` varchar(32) DEFAULT '08:00 - 16:00',
  `startKm` int NOT NULL,
  `startFullness` varchar(64) NOT NULL,
  `endKm` int DEFAULT NULL,
  `endFullness` varchar(64) DEFAULT NULL,
  `tonnage` varchar(24) DEFAULT NULL,
  `tonnageReceiptUrl` text DEFAULT NULL,
  `faultReported` boolean NOT NULL DEFAULT false,
  `status` varchar(64) NOT NULL DEFAULT 'açık',
  `startedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `endedAt` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Araç Arızaları Tablosu (vehicleFaults)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vehicleFaults` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `vehicleId` int NOT NULL,
  `reportedBy` int NOT NULL,
  `description` text NOT NULL,
  `severity` varchar(64) NOT NULL DEFAULT 'orta',
  `status` varchar(64) NOT NULL DEFAULT 'kademe_onayı_bekliyor',
  `approvedBy` int DEFAULT NULL,
  `approvalNote` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approvedAt` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Damperlik Atık Bildirimleri Tablosu (bulkWasteReports)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bulkWasteReports` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `reportedBy` int NOT NULL,
  `region` varchar(100) NOT NULL,
  `neighborhood` varchar(100) NOT NULL,
  `wasteType` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `photoUrl` text DEFAULT NULL,
  `latitude` varchar(32) NOT NULL,
  `longitude` varchar(32) NOT NULL,
  `dueAt` timestamp NOT NULL,
  `status` varchar(64) NOT NULL DEFAULT 'bekliyor',
  `collectedVehicleId` int DEFAULT NULL,
  `collectedDriverId` int DEFAULT NULL,
  `collectedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Konteyner Arızaları Tablosu (containerFaults)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `containerFaults` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `reportedBy` int NOT NULL,
  `region` varchar(100) NOT NULL,
  `neighborhood` varchar(100) NOT NULL,
  `faultType` varchar(64) NOT NULL,
  `description` text NOT NULL,
  `photoUrl` text DEFAULT NULL,
  `latitude` varchar(32) NOT NULL,
  `longitude` varchar(32) NOT NULL,
  `status` varchar(64) NOT NULL DEFAULT 'bekliyor',
  `repairedBy` int DEFAULT NULL,
  `repairNote` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `repairedAt` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Vatandaş Şikayetleri Tablosu (citizenComplaints)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `citizenComplaints` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `reportedBy` int NOT NULL,
  `region` varchar(100) NOT NULL,
  `neighborhood` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `latitude` varchar(32) NOT NULL,
  `longitude` varchar(32) NOT NULL,
  `photoUrl` text DEFAULT NULL,
  `dueAt` timestamp NOT NULL,
  `status` varchar(64) NOT NULL DEFAULT 'açık',
  `acknowledgedBy` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `acknowledgedAt` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Denetim İzi Logları Tablosu (auditLogs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auditLogs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `actorId` int NOT NULL,
  `action` varchar(120) NOT NULL,
  `entityType` varchar(100) NOT NULL,
  `entityId` int DEFAULT NULL,
  `details` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Varsayılan Admin Hesabı Ekleme (Kullanıcı Adı: admin, Şifre: admin123)
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`openId`, `name`, `username`, `passwordHash`, `isLocalAccount`, `loginMethod`, `role`, `createdAt`, `updatedAt`, `lastSignedIn`)
VALUES (
  'local:admin',
  'Sistem Yöneticisi',
  'admin',
  '1c4527d367f7b8c41692acac1a3227a1:f037e2b7037fe1041e1a5b8615fd2d3efc2de5d9a22a08bce2447a2014e968200e817537344327017eaaa06d340fa65c4a848701b8eef8cd0b492df7e29dc50d',
  1,
  'local',
  'yönetim',
  NOW(),
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE `role` = 'yönetim';

-- ------------------------------------------------------------------------------
-- Varsayılan Tepebaşı Mahalleleri Ekleme
-- ------------------------------------------------------------------------------
INSERT INTO `neighborhoods` (`region`, `name`) VALUES
  ('Batı Bölgesi', 'Batıkent Mahallesi'),
  ('Batı Bölgesi', 'Çamlıca Mahallesi'),
  ('Batı Bölgesi', 'Şirintepe Mahallesi'),
  ('Batı Bölgesi', 'Uluönder Mahallesi'),
  ('Batı Bölgesi', 'Ertuğrulgazi Mahallesi'),
  ('Merkez Bölgesi', 'Bahçelievler Mahallesi'),
  ('Merkez Bölgesi', 'Eskibağlar Mahallesi'),
  ('Merkez Bölgesi', 'Yenibağlar Mahallesi'),
  ('Merkez Bölgesi', 'Güllük Mahallesi'),
  ('Merkez Bölgesi', 'Hacı Seyit Mahallesi'),
  ('Merkez Bölgesi', 'Işıklar Mahallesi'),
  ('Merkez Bölgesi', 'Mamure Mahallesi'),
  ('Merkez Bölgesi', 'Mustafa Kemal Paşa Mahallesi'),
  ('Merkez Bölgesi', 'Ömerağa Mahallesi'),
  ('Merkez Bölgesi', 'Sümer Mahallesi'),
  ('Kuzey Bölgesi', 'Fatih Mahallesi'),
  ('Kuzey Bölgesi', 'Kumlubel Mahallesi'),
  ('Kuzey Bölgesi', 'Sütlüce Mahallesi'),
  ('Kuzey Bölgesi', 'Tunalı Mahallesi'),
  ('Kuzey Bölgesi', 'Yeşiltepe Mahallesi'),
  ('Kuzey Bölgesi', 'Zafer Mahallesi'),
  ('Kırsal / Dış Bölge', 'Aşağı Söğütönü Mahallesi'),
  ('Kırsal / Dış Bölge', 'Yukarı Söğütönü Mahallesi'),
  ('Kırsal / Dış Bölge', 'Keskin Mahallesi'),
  ('Kırsal / Dış Bölge', 'Satılmışoğlu Mahallesi')
ON DUPLICATE KEY UPDATE `region` = VALUES(`region`);

-- ------------------------------------------------------------------------------
-- 10. Mevcut Veritabanları İçin Güncelleme / Kolon Ekleme Komutları (Opsiyonel)
-- (Daha önce oluşturulmuş tabloları yeni şemaya senkronize etmek için çalıştırılabilir)
-- ------------------------------------------------------------------------------
-- ALTER TABLE `shifts` ADD COLUMN `shiftHours` varchar(32) DEFAULT '08:00 - 16:00' AFTER `vehicleType`;
-- ALTER TABLE `bulkWasteReports` ADD COLUMN `photoUrl` text DEFAULT NULL AFTER `longitude`;
-- ALTER TABLE `containerFaults` ADD COLUMN `photoUrl` text DEFAULT NULL AFTER `longitude`;

