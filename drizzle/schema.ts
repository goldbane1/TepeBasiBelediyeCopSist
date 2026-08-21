import { boolean, int, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  isLocalAccount: boolean("isLocalAccount").default(false).notNull(),
  role: mysqlEnum("role", ["şoför", "kademe personeli", "kaynak personeli", "yönetim"]).default("şoför").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const neighborhoods = mysqlTable("neighborhoods", {
  id: int("id").autoincrement().primaryKey(),
  region: varchar("region", { length: 100 }).notNull(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Neighborhood = typeof neighborhoods.$inferSelect;
export type InsertNeighborhood = typeof neighborhoods.$inferInsert;

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["çöp kamyonu", "damperli kamyon"]).notNull(),
  capacityTon: varchar("capacityTon", { length: 24 }).notNull(),
  brand: varchar("brand", { length: 100 }).notNull(),
  plate: varchar("plate", { length: 16 }).notNull().unique(),
  status: mysqlEnum("status", ["aktif", "arızalı", "bakımda"]).default("aktif").notNull(),
  nextOilMaintenanceKm: int("nextOilMaintenanceKm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

export const shifts = mysqlTable("shifts", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull(),
  vehicleId: int("vehicleId").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
  vehicleType: mysqlEnum("vehicleType", ["çöp kamyonu", "damperli kamyon"]).notNull(),
  shiftHours: varchar("shiftHours", { length: 32 }).default("08:00 - 16:00"),
  startKm: int("startKm").notNull(),
  startFullness: mysqlEnum("startFullness", ["boş", "dolu"]).notNull(),
  endKm: int("endKm"),
  endFullness: mysqlEnum("endFullness", ["boş", "dolu"]),
  tonnage: varchar("tonnage", { length: 24 }),
  tonnageReceiptUrl: longtext("tonnageReceiptUrl"),
  faultReported: boolean("faultReported").default(false).notNull(),
  status: mysqlEnum("status", ["açık", "tamamlandı"]).default("açık").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;

export const vehicleFaults = mysqlTable("vehicleFaults", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  reportedBy: int("reportedBy").notNull(),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", ["düşük", "orta", "yüksek"]).default("orta").notNull(),
  status: mysqlEnum("status", ["kademe_onayı_bekliyor", "bakımda", "onaylandı"]).default("kademe_onayı_bekliyor").notNull(),
  approvedBy: int("approvedBy"),
  approvalNote: text("approvalNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
});

export type VehicleFault = typeof vehicleFaults.$inferSelect;
export type InsertVehicleFault = typeof vehicleFaults.$inferInsert;

export const bulkWasteReports = mysqlTable("bulkWasteReports", {
  id: int("id").autoincrement().primaryKey(),
  reportedBy: int("reportedBy").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
  wasteType: varchar("wasteType", { length: 100 }).notNull(),
  description: text("description").notNull(),
  photoUrl: longtext("photoUrl"),
  latitude: varchar("latitude", { length: 32 }).notNull(),
  longitude: varchar("longitude", { length: 32 }).notNull(),
  dueAt: timestamp("dueAt").notNull(),
  status: mysqlEnum("status", ["bekliyor", "toplandı"]).default("bekliyor").notNull(),
  requiresExcavator: boolean("requiresExcavator").default(false).notNull(),
  collectedVehicleId: int("collectedVehicleId"),
  collectedDriverId: int("collectedDriverId"),
  collectedAt: timestamp("collectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BulkWasteReport = typeof bulkWasteReports.$inferSelect;
export type InsertBulkWasteReport = typeof bulkWasteReports.$inferInsert;

export const containerFaults = mysqlTable("containerFaults", {
  id: int("id").autoincrement().primaryKey(),
  reportedBy: int("reportedBy").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
  faultType: mysqlEnum("faultType", ["kol", "ayak", "gövde", "kapak", "diğer"]).notNull(),
  description: text("description").notNull(),
  photoUrl: longtext("photoUrl"),
  latitude: varchar("latitude", { length: 32 }).notNull(),
  longitude: varchar("longitude", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["bekliyor", "onarım_tamamlandı"]).default("bekliyor").notNull(),
  repairedBy: int("repairedBy"),
  repairNote: text("repairNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  repairedAt: timestamp("repairedAt"),
});

export type ContainerFault = typeof containerFaults.$inferSelect;
export type InsertContainerFault = typeof containerFaults.$inferInsert;

export const citizenComplaints = mysqlTable("citizenComplaints", {
  id: int("id").autoincrement().primaryKey(),
  reportedBy: int("reportedBy").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
  description: text("description").notNull(),
  latitude: varchar("latitude", { length: 32 }).notNull(),
  longitude: varchar("longitude", { length: 32 }).notNull(),
  photoUrl: longtext("photoUrl"),
  dueAt: timestamp("dueAt").notNull(),
  status: mysqlEnum("status", ["açık", "onay_bekliyor", "onaylandı"]).default("açık").notNull(),
  resolutionPhotoUrl: longtext("resolutionPhotoUrl"),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  acknowledgedBy: int("acknowledgedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
});

export type CitizenComplaint = typeof citizenComplaints.$inferSelect;
export type InsertCitizenComplaint = typeof citizenComplaints.$inferInsert;

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
