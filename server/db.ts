import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getLocalUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
  return result[0];
}

export async function hasLocalManagementAccount() {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(users).where(eq(users.role, "yönetim"));
  return result.some(user => user.isLocalAccount && Boolean(user.passwordHash));
}

export async function createLocalManagedUser(input: { name: string; username: string; passwordHash: string; role: InsertUser["role"] }) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
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
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");

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
  return db ? db.select().from(users) : [];
}

export async function createManagedUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.insert(users).values(user).onDuplicateKeyUpdate({
    set: { name: user.name ?? null, email: user.email ?? null, role: user.role, updatedAt: new Date() },
  });
}

export async function deleteManagedUser(openId: string) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.delete(users).where(eq(users.openId, openId));
}
