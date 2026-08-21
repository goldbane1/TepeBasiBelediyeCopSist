import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
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

let _migrationDone = false;

async function runAutoMigrations(pool: mysql.Pool) {
  if (_migrationDone) return;
  _migrationDone = true;
  try {
    const alterQueries = [
      "ALTER TABLE `bulkWasteReports` ADD COLUMN IF NOT EXISTS `photoUrl` LONGTEXT DEFAULT NULL AFTER `description`",
      "ALTER TABLE `bulkWasteReports` MODIFY COLUMN `photoUrl` LONGTEXT DEFAULT NULL",
      "ALTER TABLE `bulkWasteReports` ADD COLUMN IF NOT EXISTS `requiresExcavator` TINYINT(1) NOT NULL DEFAULT 0",
      "ALTER TABLE `shifts` MODIFY COLUMN `tonnageReceiptUrl` LONGTEXT DEFAULT NULL",
      "ALTER TABLE `containerFaults` ADD COLUMN IF NOT EXISTS `photoUrl` LONGTEXT DEFAULT NULL AFTER `description`",
      "ALTER TABLE `containerFaults` MODIFY COLUMN `photoUrl` LONGTEXT DEFAULT NULL",
      "ALTER TABLE `containerFaults` ADD COLUMN IF NOT EXISTS `repairPhotoUrl` LONGTEXT DEFAULT NULL",
      "ALTER TABLE `containerFaults` MODIFY COLUMN `repairPhotoUrl` LONGTEXT DEFAULT NULL",
      "ALTER TABLE `citizenComplaints` ADD COLUMN IF NOT EXISTS `photoUrl` LONGTEXT DEFAULT NULL AFTER `description`",
      "ALTER TABLE `citizenComplaints` MODIFY COLUMN `photoUrl` LONGTEXT DEFAULT NULL",
      "ALTER TABLE `citizenComplaints` ADD COLUMN IF NOT EXISTS `resolutionPhotoUrl` LONGTEXT DEFAULT NULL",
      "ALTER TABLE `citizenComplaints` MODIFY COLUMN `resolutionPhotoUrl` LONGTEXT DEFAULT NULL",
      // Clean up any historical corrupt description field that contains base64/CSV leftovers
      "UPDATE `bulkWasteReports` SET `description` = 'Damperlik atık bildirimi' WHERE `description` LIKE '%data:image%' OR `description` LIKE '%,39.%' OR `description` LIKE '%//9k=%' OR CHAR_LENGTH(`description`) > 400",
      "UPDATE `containerFaults` SET `description` = 'Konteyner arızası bildirimi' WHERE `description` LIKE '%data:image%' OR `description` LIKE '%,39.%' OR `description` LIKE '%//9k=%' OR CHAR_LENGTH(`description`) > 400",
      "UPDATE `citizenComplaints` SET `description` = 'Vatandaş şikayeti bildirimi' WHERE `description` LIKE '%data:image%' OR `description` LIKE '%,39.%' OR `description` LIKE '%//9k=%' OR CHAR_LENGTH(`description`) > 400",
    ];

    for (const sql of alterQueries) {
      try {
        await pool.query(sql);
      } catch {
        // Safe to ignore if column already exists or syntax variation
      }
    }
    console.log("[Database] Schema check and corrupt data cleanup completed.");
  } catch (err) {
    console.warn("[Database] Schema check error:", err);
  }
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
      _db = drizzle({ client: _pool as any, schema, mode: "default" }) as any;
      console.log("[Database] Drizzle instance ready.");
      runAutoMigrations(_pool).catch(() => {});
    } catch (error) {
      console.error("[Database] Failed to connect with SSL options, trying default pool...", error);
      try {
        _pool = mysql.createPool({
          uri: connectionString,
          waitForConnections: true,
          connectionLimit: 10,
        });
        _db = drizzle({ client: _pool as any, schema, mode: "default" }) as any;
        runAutoMigrations(_pool).catch(() => {});
      } catch (err2) {
        console.error("[Database] Connection pool failed completely:", err2);
        _db = null;
      }
    }
  }
  return _db;
}

export async function ensureTablesExist() {
  if (_pool) {
    await runAutoMigrations(_pool);
  }
  return true;
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
    const result = await db.select().from(users).where(eq(users.role, "yönetim"));
    return result.some((user: any) => user.isLocalAccount && Boolean(user.passwordHash));
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
  await getDb();
  if (!_pool) {
    throw new Error("Veritabanı bağlantı havuzu oluşturulamadı. Lütfen DATABASE_URL adresini kontrol edin.");
  }

  const username = input.username.toLowerCase();
  const existing = await getLocalUserByUsername(username);
  if (existing) throw new Error("Bu kullanıcı adı zaten kullanımda.");
  const openId = `local:${username}`;
  const now = new Date();

  await _pool.query(
    `INSERT INTO \`users\` (\`openId\`, \`name\`, \`username\`, \`passwordHash\`, \`isLocalAccount\`, \`loginMethod\`, \`role\`, \`createdAt\`, \`updatedAt\`, \`lastSignedIn\`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [openId, input.name, username, input.passwordHash, true, "local", input.role ?? "yönetim", now, now, now]
  );

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
    return await db.select().from(users);
  } catch (e) {
    console.warn("[Database] Error listing managed users:", e);
    return [];
  }
}

export async function createManagedUser(user: InsertUser) {
  const connectionString = getDatabaseConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL değişkeni bulunamadı.");
  }
  await getDb();
  if (!_pool) throw new Error("Veritabanı bağlantısı kurulamadı.");

  const now = new Date();
  await _pool.query(
    `INSERT INTO \`users\` (\`openId\`, \`name\`, \`email\`, \`loginMethod\`, \`username\`, \`passwordHash\`, \`isLocalAccount\`, \`role\`, \`createdAt\`, \`updatedAt\`, \`lastSignedIn\`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`email\`=VALUES(\`email\`), \`role\`=VALUES(\`role\`), \`updatedAt\`=?`,
    [user.openId, user.name ?? null, user.email ?? null, user.loginMethod ?? null, user.username ?? null, user.passwordHash ?? null, user.isLocalAccount ?? false, user.role ?? "şoför", now, now, now, now]
  );
}

export async function deleteManagedUser(openId: string) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı. Lütfen DATABASE_URL değişkenini kontrol edin.");
  await db.delete(users).where(eq(users.openId, openId));
}
