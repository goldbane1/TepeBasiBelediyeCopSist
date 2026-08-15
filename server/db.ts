import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

export function getDatabaseConnectionString(): string | undefined {
  const url = (
    process.env.DATABASE_URL ||
    process.env.MYSQLPUBLIC_URL ||
    process.env.MYSQL_PUBLIC_URL ||
    process.env.MYSQL_URL ||
    process.env.MYSQLPRIVATE_URL ||
    process.env.MYSQL_PRIVATE_URL
  );
  return url;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  const connectionString = getDatabaseConnectionString();
  if (!connectionString) {
    console.warn("[Database] No connection string found in environment variables.");
    return null;
  }

  if (!_db) {
    try {
      console.log("[Database] Initializing MySQL connection pool...");
      _pool = mysql.createPool({
        uri: connectionString,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000,
        ssl: connectionString.includes("rlwy.net") || connectionString.includes("railway") || connectionString.includes("tidbcloud") ? { rejectUnauthorized: false } : undefined,
      });
      _db = drizzle({ client: _pool });
      console.log("[Database] Drizzle instance ready.");
    } catch (error) {
      console.error("[Database] Failed to connect with SSL options, trying default pool...", error);
      try {
        _pool = mysql.createPool({
          uri: connectionString,
          waitForConnections: true,
          connectionLimit: 10,
        });
        _db = drizzle({ client: _pool });
      } catch (err2) {
        console.error("[Database] Connection pool failed completely:", err2);
        _db = null;
      }
    }
  }
  return _db;
}

export async function ensureTablesExist() {
  await getDb();
  if (!_pool) {
    console.warn("[Database] Cannot ensure tables: no database connection pool.");
    return false;
  }

  try {
    console.log("[Database] Ensuring SQL tables exist via pool...");
    await _pool.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`openId\` varchar(64) NOT NULL UNIQUE,
        \`name\` text,
        \`email\` varchar(320),
        \`loginMethod\` varchar(64),
        \`username\` varchar(64) UNIQUE,
        \`passwordHash\` varchar(255),
        \`isLocalAccount\` boolean NOT NULL DEFAULT false,
        \`role\` varchar(64) NOT NULL DEFAULT 'şoför',
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`lastSignedIn\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure role column is varchar(64) if table existed prior
    try {
      await _pool.query(`ALTER TABLE \`users\` MODIFY COLUMN \`role\` varchar(64) NOT NULL DEFAULT 'şoför';`);
    } catch (e) {
      // Ignore if alter fails or already modified
    }

    await _pool.query(`
      CREATE TABLE IF NOT EXISTS \`vehicles\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`type\` varchar(64) NOT NULL,
        \`capacityTon\` varchar(24) NOT NULL,
        \`brand\` varchar(100) NOT NULL,
        \`plate\` varchar(16) NOT NULL UNIQUE,
        \`status\` varchar(64) NOT NULL DEFAULT 'aktif',
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await _pool.query(`
      CREATE TABLE IF NOT EXISTS \`shifts\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`driverId\` int NOT NULL,
        \`vehicleId\` int NOT NULL,
        \`region\` varchar(100) NOT NULL,
        \`neighborhood\` varchar(100) NOT NULL,
        \`vehicleType\` varchar(64) NOT NULL,
        \`startKm\` int NOT NULL,
        \`startFullness\` varchar(64) NOT NULL,
        \`endKm\` int,
        \`endFullness\` varchar(64),
        \`tonnage\` varchar(24),
        \`tonnageReceiptUrl\` text,
        \`faultReported\` boolean NOT NULL DEFAULT false,
        \`status\` varchar(64) NOT NULL DEFAULT 'açık',
        \`startedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`endedAt\` timestamp
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await _pool.query(`
      CREATE TABLE IF NOT EXISTS \`vehicleFaults\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`vehicleId\` int NOT NULL,
        \`reportedBy\` int NOT NULL,
        \`description\` text NOT NULL,
        \`severity\` varchar(64) NOT NULL DEFAULT 'orta',
        \`status\` varchar(64) NOT NULL DEFAULT 'kademe_onayı_bekliyor',
        \`approvedBy\` int,
        \`approvalNote\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`approvedAt\` timestamp
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await _pool.query(`
      CREATE TABLE IF NOT EXISTS \`bulkWasteReports\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`reportedBy\` int NOT NULL,
        \`region\` varchar(100) NOT NULL,
        \`neighborhood\` varchar(100) NOT NULL,
        \`wasteType\` varchar(100) NOT NULL,
        \`description\` text NOT NULL,
        \`latitude\` varchar(32) NOT NULL,
        \`longitude\` varchar(32) NOT NULL,
        \`dueAt\` timestamp NOT NULL,
        \`status\` varchar(64) NOT NULL DEFAULT 'bekliyor',
        \`collectedVehicleId\` int,
        \`collectedDriverId\` int,
        \`collectedAt\` timestamp,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await _pool.query(`
      CREATE TABLE IF NOT EXISTS \`containerFaults\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`reportedBy\` int NOT NULL,
        \`region\` varchar(100) NOT NULL,
        \`neighborhood\` varchar(100) NOT NULL,
        \`faultType\` varchar(64) NOT NULL,
        \`description\` text NOT NULL,
        \`latitude\` varchar(32) NOT NULL,
        \`longitude\` varchar(32) NOT NULL,
        \`status\` varchar(64) NOT NULL DEFAULT 'bekliyor',
        \`repairedBy\` int,
        \`repairNote\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`repairedAt\` timestamp
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await _pool.query(`
      CREATE TABLE IF NOT EXISTS \`citizenComplaints\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`reportedBy\` int NOT NULL,
        \`region\` varchar(100) NOT NULL,
        \`neighborhood\` varchar(100) NOT NULL,
        \`description\` text NOT NULL,
        \`latitude\` varchar(32) NOT NULL,
        \`longitude\` varchar(32) NOT NULL,
        \`photoUrl\` text,
        \`dueAt\` timestamp NOT NULL,
        \`status\` varchar(64) NOT NULL DEFAULT 'açık',
        \`acknowledgedBy\` int,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`acknowledgedAt\` timestamp
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await _pool.query(`
      CREATE TABLE IF NOT EXISTS \`auditLogs\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`actorId\` int NOT NULL,
        \`action\` varchar(120) NOT NULL,
        \`entityType\` varchar(100) NOT NULL,
        \`entityId\` int,
        \`details\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("[Database] All tables initialized successfully via pool with utf8mb4_unicode_ci.");
    return true;
  } catch (err) {
    console.error("[Database] Error ensuring tables exist:", err);
    return false;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    await ensureTablesExist();
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'yönetim';
      updateSet.role = 'yönetim';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  try {
    await ensureTablesExist();
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (e) {
    console.warn("[Database] Error in getUserByOpenId:", e);
    return undefined;
  }
}

export async function getLocalUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    await ensureTablesExist();
    const result = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
    return result[0];
  } catch (e) {
    console.warn("[Database] Error in getLocalUserByUsername:", e);
    return undefined;
  }
}

export async function hasLocalManagementAccount() {
  const db = await getDb();
  if (!db) return false;
  try {
    await ensureTablesExist();
    const result = await db.select().from(users).where(eq(users.role, "yönetim"));
    return result.some(user => user.isLocalAccount && Boolean(user.passwordHash));
  } catch (e) {
    console.warn("[Database] Error checking management account, ensuring tables:", e);
    return false;
  }
}

export async function createLocalManagedUser(input: { name: string; username: string; passwordHash: string; role: InsertUser["role"] }) {
  const connectionString = getDatabaseConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL veya MYSQL_URL değişkeni bulunamadı. Lütfen Render paneline değişkeni ekleyip servisi 'Manual Deploy' yapın.");
  }
  const db = await getDb();
  if (!db) {
    throw new Error("Veritabanı bağlantı havuzu oluşturulamadı. Lütfen DATABASE_URL adresini kontrol edin.");
  }
  await ensureTablesExist();

  const username = input.username.toLowerCase();
  const existing = await getLocalUserByUsername(username);
  if (existing) throw new Error("Bu kullanıcı adı zaten kullanımda.");
  const openId = `local:${username}`;
  await db.insert(users).values({
    openId,
    name: input.name,
    username,
    passwordHash: input.passwordHash,
    isLocalAccount: true,
    loginMethod: "local",
    role: input.role ?? "şoför",
    lastSignedIn: new Date(),
  });
  return getUserByOpenId(openId);
}

export async function updateLocalManagedUser(input: {
  openId: string;
  name?: string;
  username?: string;
  passwordHash?: string;
  role?: InsertUser["role"];
}) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı. Lütfen DATABASE_URL değişkenini kontrol edin.");
  await ensureTablesExist();

  const [existing] = await db.select().from(users).where(eq(users.openId, input.openId)).limit(1);
  if (!existing) throw new Error("Kullanıcı bulunamadı.");

  const updates: Partial<InsertUser> = { updatedAt: new Date() };
  if (input.name) updates.name = input.name;
  if (input.role) updates.role = input.role;
  if (input.passwordHash) updates.passwordHash = input.passwordHash;

  if (input.username && input.username.toLowerCase() !== existing.username) {
    const newUsername = input.username.toLowerCase();
    const usernameTaken = await getLocalUserByUsername(newUsername);
    if (usernameTaken) throw new Error("Bu kullanıcı adı başka bir kullanıcı tarafından kullanılıyor.");
    updates.username = newUsername;
  }

  await db.update(users).set(updates).where(eq(users.openId, input.openId));
  return getUserByOpenId(input.openId);
}

export async function listManagedUsers() {
  const db = await getDb();
  if (!db) return [];
  try {
    await ensureTablesExist();
    return await db.select().from(users);
  } catch (e) {
    console.warn("[Database] Error listing managed users:", e);
    return [];
  }
}

export async function createManagedUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı. Lütfen DATABASE_URL değişkenini kontrol edin.");
  await ensureTablesExist();
  await db.insert(users).values(user).onDuplicateKeyUpdate({
    set: { name: user.name ?? null, email: user.email ?? null, role: user.role, updatedAt: new Date() },
  });
}

export async function deleteManagedUser(openId: string) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı. Lütfen DATABASE_URL değişkenini kontrol edin.");
  await db.delete(users).where(eq(users.openId, openId));
}
