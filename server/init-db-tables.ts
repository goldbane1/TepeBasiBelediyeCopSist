import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { hashPassword } from "./local-auth.js";

dotenv.config();

async function initDbTables() {
  const connection = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "tepebasi_temizlik",
    multipleStatements: true,
  });

  console.log("Connected to XAMPP MySQL database 'tepebasi_temizlik'");

  const ddl = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openId VARCHAR(64) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(320),
    loginMethod VARCHAR(64),
    username VARCHAR(64) UNIQUE,
    passwordHash VARCHAR(255),
    isLocalAccount BOOLEAN NOT NULL DEFAULT FALSE,
    role ENUM('şoför', 'kademe personeli', 'kaynak personeli', 'yönetim') NOT NULL DEFAULT 'şoför',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('çöp kamyonu', 'damperli kamyon') NOT NULL,
    capacityTon VARCHAR(24) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    plate VARCHAR(16) NOT NULL UNIQUE,
    status ENUM('aktif', 'arızalı', 'bakımda') NOT NULL DEFAULT 'aktif',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driverId INT NOT NULL,
    vehicleId INT NOT NULL,
    region VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    vehicleType ENUM('çöp kamyonu', 'damperli kamyon') NOT NULL,
    startKm INT NOT NULL,
    startFullness ENUM('boş', 'dolu') NOT NULL,
    endKm INT,
    endFullness ENUM('boş', 'dolu'),
    tonnage VARCHAR(24),
    tonnageReceiptUrl TEXT,
    faultReported BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('açık', 'tamamlandı') NOT NULL DEFAULT 'açık',
    startedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    endedAt TIMESTAMP NULL DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS vehicleFaults (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicleId INT NOT NULL,
    reportedBy INT NOT NULL,
    description TEXT NOT NULL,
    severity ENUM('düşük', 'orta', 'yüksek') NOT NULL DEFAULT 'orta',
    status ENUM('kademe_onayı_bekliyor', 'bakımda', 'onaylandı') NOT NULL DEFAULT 'kademe_onayı_bekliyor',
    approvedBy INT,
    approvalNote TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approvedAt TIMESTAMP NULL DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS bulkWasteReports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reportedBy INT NOT NULL,
    region VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    wasteType VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    latitude VARCHAR(32) NOT NULL,
    longitude VARCHAR(32) NOT NULL,
    dueAt TIMESTAMP NOT NULL,
    status ENUM('bekliyor', 'toplandı') NOT NULL DEFAULT 'bekliyor',
    collectedVehicleId INT,
    collectedDriverId INT,
    collectedAt TIMESTAMP NULL DEFAULT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS containerFaults (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reportedBy INT NOT NULL,
    region VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    faultType ENUM('kol', 'ayak', 'gövde', 'kapak', 'diğer') NOT NULL,
    description TEXT NOT NULL,
    latitude VARCHAR(32) NOT NULL,
    longitude VARCHAR(32) NOT NULL,
    status ENUM('bekliyor', 'onarım_tamamlandı') NOT NULL DEFAULT 'bekliyor',
    repairedBy INT,
    repairNote TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    repairedAt TIMESTAMP NULL DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS citizenComplaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reportedBy INT NOT NULL,
    region VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    latitude VARCHAR(32) NOT NULL,
    longitude VARCHAR(32) NOT NULL,
    photoUrl TEXT,
    dueAt TIMESTAMP NOT NULL,
    status ENUM('açık', 'onaylandı') NOT NULL DEFAULT 'açık',
    acknowledgedBy INT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledgedAt TIMESTAMP NULL DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS auditLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actorId INT NOT NULL,
    action VARCHAR(120) NOT NULL,
    entityType VARCHAR(100) NOT NULL,
    entityId INT,
    details TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await connection.query(ddl);
  console.log("All 8 tables verified in XAMPP MySQL database!");

  // Seed default admin user if missing
  const [usersRows] = await connection.query("SELECT COUNT(*) as count FROM users");
  if ((usersRows as any[])[0].count === 0) {
    const adminHash = await hashPassword("admin123");
    const driverHash = await hashPassword("123456");

    await connection.query(
      `INSERT INTO users (openId, name, username, passwordHash, isLocalAccount, role, loginMethod) VALUES
       ('local:admin', 'Tepebaşı Yönetim', 'admin', ?, 1, 'yönetim', 'local'),
       ('local:sofor1', 'Ahmet Yılmaz', 'sofor1', ?, 1, 'şoför', 'local')`,
      [adminHash, driverHash]
    );
    console.log("Default admin ('admin' / 'admin123') and driver ('sofor1' / '123456') accounts created.");
  }

  // Seed default vehicles if missing
  const [vehRows] = await connection.query("SELECT COUNT(*) as count FROM vehicles");
  if ((vehRows as any[])[0].count === 0) {
    await connection.query(
      `INSERT INTO vehicles (type, capacityTon, brand, plate, status) VALUES
       ('çöp kamyonu', '13', 'Mercedes-Benz Atego', '26 TP 101', 'aktif'),
       ('damperli kamyon', '18', 'Ford Cargo', '26 TP 202', 'aktif'),
       ('çöp kamyonu', '13', 'BMC Tuğra', '26 TP 103', 'aktif')`
    );
    console.log("Default vehicles seeded.");
  }

  // Seed sample map operations if missing
  const [wasteRows] = await connection.query("SELECT COUNT(*) as count FROM bulkWasteReports");
  if ((wasteRows as any[])[0].count === 0) {
    const pastDate = new Date(Date.now() - 3600 * 1000 * 5).toISOString().slice(0, 19).replace('T', ' ');
    const futureDate = new Date(Date.now() + 3600 * 1000 * 24).toISOString().slice(0, 19).replace('T', ' ');

    await connection.query(
      `INSERT INTO bulkWasteReports (reportedBy, region, neighborhood, wasteType, description, latitude, longitude, dueAt, status) VALUES
       (1, 'Tepebaşı', 'Hoşnudiye', 'Eski Mobilya & Koltuk', 'İsmet İnönü-1 Caddesi üzeri kaldırım kenarında eski 3lü koltuk.', '39.7785', '30.5180', ?, 'bekliyor'),
       (1, 'Tepebaşı', 'Batıkent', 'Hafriyat & Moloz', 'Ulusal Egemenlik Bulvarı yakını çuval moloz.', '39.7912', '30.4895', ?, 'bekliyor')`,
      [pastDate, futureDate]
    );

    await connection.query(
      `INSERT INTO containerFaults (reportedBy, region, neighborhood, faultType, description, latitude, longitude, status) VALUES
       (1, 'Tepebaşı', 'Eskibağlar', 'kapak', 'Üst kapak menteşesinden kopmuş, tehlike arz ediyor.', '39.7820', '30.5090', 'bekliyor')`
    );

    await connection.query(
      `INSERT INTO citizenComplaints (reportedBy, region, neighborhood, description, latitude, longitude, dueAt, status) VALUES
       (1, 'Tepebaşı', 'Şirintepe', 'Konteyner çevresine dökülen çöp şikayeti.', '39.7950', '30.5220', ?, 'açık')`,
      [pastDate]
    );
    console.log("Sample operational map points seeded for Tepebaşı/Eskişehir.");
  }

  await connection.end();
}

initDbTables().catch((err) => {
  console.error("Failed to initialize database tables:", err);
  process.exit(1);
});
