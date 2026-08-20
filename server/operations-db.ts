import { and, desc, eq, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import {
  auditLogs,
  bulkWasteReports,
  citizenComplaints,
  containerFaults,
  neighborhoods,
  shifts,
  users,
  vehicleFaults,
  vehicles,
} from "../drizzle/schema";
import { getDb } from "./db";

export type ShiftEligibility = {
  allowed: boolean;
  reason?: string;
};

type ActiveShiftContext = { vehicleId: number; vehicleType: "çöp kamyonu" | "damperli kamyon" } | null | undefined;

export function getShiftEligibility(vehicleStatus: string, openFaultCount: number): ShiftEligibility {
  if (vehicleStatus !== "aktif") {
    return { allowed: false, reason: "Arızalı veya bakımda olan araçlar ile mesai başlatılamaz." };
  }
  if (openFaultCount > 0) {
    return { allowed: false, reason: "Bu araç için henüz onaylanmamış kademe arıza kaydı bulunmaktadır." };
  }
  return { allowed: true };
}

export function getWasteFlowEligibility(
  activeShift: ActiveShiftContext,
  requiredVehicleType: "çöp kamyonu" | "damperli kamyon",
  selectedVehicleId?: number,
): ShiftEligibility {
  if (!activeShift || activeShift.vehicleType !== requiredVehicleType) {
    return { allowed: false, reason: `Bu işlem için aktif ${requiredVehicleType} mesaisi gereklidir.` };
  }
  if (selectedVehicleId !== undefined && activeShift.vehicleId !== selectedVehicleId) {
    return { allowed: false, reason: "Toplama işlemi yalnızca aktif mesainizde seçili araç ile kaydedilebilir." };
  }
  return { allowed: true };
}

export function firstOrNull<T>(rows: T[]): T | null {
  return rows.length > 0 ? rows[0] : null;
}

// -----------------------------------------------------------------------------
// USERS (KULLANICILAR)
// -----------------------------------------------------------------------------
export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.name);
}

export async function updateUserRole(id: number, role: "şoför" | "kademe personeli" | "kaynak personeli" | "yönetim") {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(users).set({ role }).where(eq(users.id, id));
}

// -----------------------------------------------------------------------------
// NEIGHBORHOODS (MAHALLELER)
// -----------------------------------------------------------------------------
export async function listNeighborhoods() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(neighborhoods).orderBy(neighborhoods.region, neighborhoods.name);
  } catch (e) {
    console.warn("[Database] Error listing neighborhoods:", e);
    return [];
  }
}

export async function createNeighborhood(data: typeof neighborhoods.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.insert(neighborhoods).values(data);
}

export async function updateNeighborhood(id: number, data: Partial<typeof neighborhoods.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(neighborhoods).set(data).where(eq(neighborhoods.id, id));
}

export async function deleteNeighborhood(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.delete(neighborhoods).where(eq(neighborhoods.id, id));
}

// -----------------------------------------------------------------------------
// VEHICLES (ARAÇLAR)
// -----------------------------------------------------------------------------
export async function listVehicles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicles).orderBy(vehicles.plate);
}

export async function createVehicle(data: typeof vehicles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.insert(vehicles).values(data);
}

export async function updateVehicle(id: number, data: Partial<typeof vehicles.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(vehicles).set(data).where(eq(vehicles.id, id));
}

export async function updateVehicleStatus(id: number, status: "aktif" | "arızalı" | "bakımda") {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(vehicles).set({ status }).where(eq(vehicles.id, id));

  if (status === "aktif") {
    await db
      .update(vehicleFaults)
      .set({ status: "onaylandı", approvedAt: new Date() })
      .where(and(eq(vehicleFaults.vehicleId, id), sql`${vehicleFaults.status} IN ('kademe_onayı_bekliyor', 'bakımda')`));
  } else if (status === "arızalı" || status === "bakımda") {
    const [existingFault] = await db
      .select()
      .from(vehicleFaults)
      .where(and(eq(vehicleFaults.vehicleId, id), sql`${vehicleFaults.status} IN ('kademe_onayı_bekliyor', 'bakımda')`))
      .limit(1);

    if (existingFault) {
      await db.update(vehicleFaults).set({ status: status === "bakımda" ? "bakımda" : "kademe_onayı_bekliyor" }).where(eq(vehicleFaults.id, existingFault.id));
    }
  }
}

export async function deleteVehicle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.delete(vehicles).where(eq(vehicles.id, id));
}

export async function getVehicleShiftEligibility(vehicleId: number): Promise<ShiftEligibility> {
  const db = await getDb();
  if (!db) return { allowed: false, reason: "Veritabanı bağlantısı kurulamadı." };
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1);
  if (!vehicle) return { allowed: false, reason: "Seçilen araç sistemde bulunamadı." };

  const [openFault] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicleFaults)
    .where(and(eq(vehicleFaults.vehicleId, vehicleId), eq(vehicleFaults.status, "kademe_onayı_bekliyor")));

  return getShiftEligibility(vehicle.status, Number(openFault?.count ?? 0));
}

// -----------------------------------------------------------------------------
// SHIFTS (MESAİLER)
// -----------------------------------------------------------------------------
export async function startShift(data: typeof shifts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");

  const [activeShift] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.driverId, data.driverId), eq(shifts.status, "açık")))
    .limit(1);

  if (activeShift) {
    throw new Error("Aktif bir mesainiz zaten bulunmaktadır. Yeni mesai başlatmadan önce mevcudu sonlandırın.");
  }

  const eligibility = await getVehicleShiftEligibility(data.vehicleId);
  if (!eligibility.allowed) {
    throw new Error(eligibility.reason);
  }

  await db.insert(shifts).values(data);
}

export async function finishShift(id: number, data: Partial<typeof shifts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(shifts).set({ ...data, status: "tamamlandı", endedAt: new Date() }).where(eq(shifts.id, id));
}

export async function updateShift(id: number, data: Partial<typeof shifts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(shifts).set(data).where(eq(shifts.id, id));
}

export async function deleteShift(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.delete(shifts).where(eq(shifts.id, id));
}

export async function listShifts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: shifts.id,
      driverId: shifts.driverId,
      driverName: users.name,
      driverUsername: users.username,
      driverRole: users.role,
      vehicleId: shifts.vehicleId,
      vehiclePlate: vehicles.plate,
      vehicleBrand: vehicles.brand,
      region: shifts.region,
      neighborhood: shifts.neighborhood,
      vehicleType: shifts.vehicleType,
      shiftHours: shifts.shiftHours,
      startKm: shifts.startKm,
      startFullness: shifts.startFullness,
      endKm: shifts.endKm,
      endFullness: shifts.endFullness,
      tonnage: shifts.tonnage,
      tonnageReceiptUrl: shifts.tonnageReceiptUrl,
      faultReported: shifts.faultReported,
      status: shifts.status,
      startedAt: shifts.startedAt,
      endedAt: shifts.endedAt,
    })
    .from(shifts)
    .leftJoin(users, eq(shifts.driverId, users.id))
    .leftJoin(vehicles, eq(shifts.vehicleId, vehicles.id))
    .orderBy(desc(shifts.startedAt));
}

export async function listDriverRecentShifts(driverId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: shifts.id,
      driverId: shifts.driverId,
      vehicleId: shifts.vehicleId,
      vehiclePlate: vehicles.plate,
      vehicleBrand: vehicles.brand,
      region: shifts.region,
      neighborhood: shifts.neighborhood,
      vehicleType: shifts.vehicleType,
      shiftHours: shifts.shiftHours,
      startKm: shifts.startKm,
      startFullness: shifts.startFullness,
      endKm: shifts.endKm,
      endFullness: shifts.endFullness,
      tonnage: shifts.tonnage,
      tonnageReceiptUrl: shifts.tonnageReceiptUrl,
      faultReported: shifts.faultReported,
      status: shifts.status,
      startedAt: shifts.startedAt,
      endedAt: shifts.endedAt,
    })
    .from(shifts)
    .leftJoin(vehicles, eq(shifts.vehicleId, vehicles.id))
    .where(eq(shifts.driverId, driverId))
    .orderBy(desc(shifts.startedAt))
    .limit(limit);
}

export async function getCurrentShiftForDriver(driverId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(shifts).where(and(eq(shifts.driverId, driverId), eq(shifts.status, "açık"))).orderBy(desc(shifts.startedAt)).limit(1);
  return firstOrNull(result);
}

export async function requireActiveWasteShift(
  driverId: number,
  requiredVehicleType: "çöp kamyonu" | "damperli kamyon",
  selectedVehicleId?: number,
) {
  const currentShift = await getCurrentShiftForDriver(driverId);
  const eligibility = getWasteFlowEligibility(currentShift, requiredVehicleType, selectedVehicleId);
  if (!eligibility.allowed) throw new Error(eligibility.reason);
  return currentShift;
}

// -----------------------------------------------------------------------------
// VEHICLE FAULTS (ARAÇ ARIZALARI)
// -----------------------------------------------------------------------------
export async function listVehicleFaults() {
  const db = await getDb();
  return db ? db.select().from(vehicleFaults).orderBy(desc(vehicleFaults.createdAt)) : [];
}

export async function createVehicleFault(data: typeof vehicleFaults.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.insert(vehicleFaults).values(data);
  await db.update(vehicles).set({ status: "arızalı" }).where(eq(vehicles.id, data.vehicleId));
}

export async function reviewVehicleFault(id: number, approvedBy: number, approved: boolean, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  const [fault] = await db.select().from(vehicleFaults).where(eq(vehicleFaults.id, id)).limit(1);
  if (!fault) throw new Error("Arıza kaydı bulunamadı.");
  const status = approved ? "onaylandı" : "bakımda";
  await db.update(vehicleFaults).set({ status, approvedBy, approvalNote: note ?? null, approvedAt: new Date() }).where(eq(vehicleFaults.id, id));

  const vehicleStatus = approved ? "aktif" : "bakımda";
  await db.update(vehicles).set({ status: vehicleStatus }).where(eq(vehicles.id, fault.vehicleId));
}

// -----------------------------------------------------------------------------
// BULK WASTE REPORTS (DAMPERLİK ATIK)
// -----------------------------------------------------------------------------
export async function listBulkWasteReports() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: bulkWasteReports.id,
      reportedBy: bulkWasteReports.reportedBy,
      reporterName: users.name,
      region: bulkWasteReports.region,
      neighborhood: bulkWasteReports.neighborhood,
      wasteType: bulkWasteReports.wasteType,
      description: bulkWasteReports.description,
      photoUrl: bulkWasteReports.photoUrl,
      latitude: bulkWasteReports.latitude,
      longitude: bulkWasteReports.longitude,
      dueAt: bulkWasteReports.dueAt,
      status: bulkWasteReports.status,
      requiresExcavator: bulkWasteReports.requiresExcavator,
      collectedVehicleId: bulkWasteReports.collectedVehicleId,
      collectedDriverId: bulkWasteReports.collectedDriverId,
      collectedAt: bulkWasteReports.collectedAt,
      createdAt: bulkWasteReports.createdAt,
    })
    .from(bulkWasteReports)
    .leftJoin(users, eq(bulkWasteReports.reportedBy, users.id))
    .orderBy(desc(bulkWasteReports.createdAt));
}

export async function createBulkWasteReport(data: typeof bulkWasteReports.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.insert(bulkWasteReports).values(data);
}

export async function updateBulkWasteReport(id: number, data: Partial<typeof bulkWasteReports.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(bulkWasteReports).set(data).where(eq(bulkWasteReports.id, id));
}

export async function deleteBulkWasteReport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.delete(bulkWasteReports).where(eq(bulkWasteReports.id, id));
}

export async function collectBulkWaste(id: number, vehicleId: number, driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(bulkWasteReports).set({ status: "toplandı", collectedVehicleId: vehicleId, collectedDriverId: driverId, collectedAt: new Date() }).where(eq(bulkWasteReports.id, id));
}

// -----------------------------------------------------------------------------
// CONTAINER FAULTS (KONTEYNER ARIZALARI)
// -----------------------------------------------------------------------------
export async function listContainerFaults() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: containerFaults.id,
      reportedBy: containerFaults.reportedBy,
      reporterName: users.name,
      region: containerFaults.region,
      neighborhood: containerFaults.neighborhood,
      faultType: containerFaults.faultType,
      description: containerFaults.description,
      photoUrl: containerFaults.photoUrl,
      latitude: containerFaults.latitude,
      longitude: containerFaults.longitude,
      status: containerFaults.status,
      repairedBy: containerFaults.repairedBy,
      repairNote: containerFaults.repairNote,
      createdAt: containerFaults.createdAt,
      repairedAt: containerFaults.repairedAt,
    })
    .from(containerFaults)
    .leftJoin(users, eq(containerFaults.reportedBy, users.id))
    .orderBy(desc(containerFaults.createdAt));
}

export async function createContainerFault(data: typeof containerFaults.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.insert(containerFaults).values(data);
}

export async function updateContainerFault(id: number, data: Partial<typeof containerFaults.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(containerFaults).set(data).where(eq(containerFaults.id, id));
}

export async function deleteContainerFault(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.delete(containerFaults).where(eq(containerFaults.id, id));
}

export async function repairContainerFault(id: number, technicianId: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(containerFaults).set({ status: "onarım_tamamlandı", repairedBy: technicianId, repairNote: note ?? null, repairedAt: new Date() }).where(eq(containerFaults.id, id));
}

// -----------------------------------------------------------------------------
// CITIZEN COMPLAINTS (VATANDAŞ ŞİKAYETLERİ)
// -----------------------------------------------------------------------------
const reporterUsers = alias(users, "reporterUsers");
const resolverUsers = alias(users, "resolverUsers");
const ackUsers = alias(users, "ackUsers");

export async function listCitizenComplaints() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: citizenComplaints.id,
      reportedBy: citizenComplaints.reportedBy,
      reporterName: reporterUsers.name,
      region: citizenComplaints.region,
      neighborhood: citizenComplaints.neighborhood,
      description: citizenComplaints.description,
      photoUrl: citizenComplaints.photoUrl,
      latitude: citizenComplaints.latitude,
      longitude: citizenComplaints.longitude,
      dueAt: citizenComplaints.dueAt,
      status: citizenComplaints.status,
      resolutionPhotoUrl: citizenComplaints.resolutionPhotoUrl,
      resolvedBy: citizenComplaints.resolvedBy,
      resolverName: resolverUsers.name,
      resolvedAt: citizenComplaints.resolvedAt,
      acknowledgedBy: citizenComplaints.acknowledgedBy,
      acknowledgedByName: ackUsers.name,
      acknowledgedAt: citizenComplaints.acknowledgedAt,
      createdAt: citizenComplaints.createdAt,
    })
    .from(citizenComplaints)
    .leftJoin(reporterUsers, eq(citizenComplaints.reportedBy, reporterUsers.id))
    .leftJoin(resolverUsers, eq(citizenComplaints.resolvedBy, resolverUsers.id))
    .leftJoin(ackUsers, eq(citizenComplaints.acknowledgedBy, ackUsers.id))
    .orderBy(desc(citizenComplaints.createdAt));
}

export async function createCitizenComplaint(data: typeof citizenComplaints.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.insert(citizenComplaints).values(data);
}

export async function updateCitizenComplaint(id: number, data: Partial<typeof citizenComplaints.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(citizenComplaints).set(data).where(eq(citizenComplaints.id, id));
}

export async function deleteCitizenComplaint(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.delete(citizenComplaints).where(eq(citizenComplaints.id, id));
}

export async function resolveCitizenComplaint(id: number, driverId: number, photoUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db
    .update(citizenComplaints)
    .set({
      status: "onay_bekliyor",
      resolutionPhotoUrl: photoUrl,
      resolvedBy: driverId,
      resolvedAt: new Date(),
    })
    .where(eq(citizenComplaints.id, id));
}

export async function approveCitizenComplaint(id: number, managerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db
    .update(citizenComplaints)
    .set({
      status: "onaylandı",
      acknowledgedBy: managerId,
      acknowledgedAt: new Date(),
    })
    .where(eq(citizenComplaints.id, id));
}

export async function rejectCitizenComplaint(id: number, managerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db
    .update(citizenComplaints)
    .set({
      status: "açık",
    })
    .where(eq(citizenComplaints.id, id));
}

export async function acknowledgeCitizenComplaint(id: number, driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(citizenComplaints).set({ status: "onaylandı", acknowledgedBy: driverId, acknowledgedAt: new Date() }).where(eq(citizenComplaints.id, id));
}

// -----------------------------------------------------------------------------
// AUDIT LOGS & REPORTS
// -----------------------------------------------------------------------------
export async function addAuditLog(data: typeof auditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data);
}

export async function listAuditLogs() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: auditLogs.id,
      actorId: auditLogs.actorId,
      actorName: users.name,
      actorUsername: users.username,
      actorRole: users.role,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(1000);
}

export async function getOperationalSummary() {
  const db = await getDb();
  if (!db) return { vehicleCount: 0, activeShiftCount: 0, pendingWasteCount: 0, overdueComplaintCount: 0 };
  const [vehicleCount] = await db.select({ count: sql<number>`count(*)` }).from(vehicles);
  const [activeShiftCount] = await db.select({ count: sql<number>`count(*)` }).from(shifts).where(eq(shifts.status, "açık"));
  const [pendingWasteCount] = await db.select({ count: sql<number>`count(*)` }).from(bulkWasteReports).where(eq(bulkWasteReports.status, "bekliyor"));
  const [overdueComplaintCount] = await db.select({ count: sql<number>`count(*)` }).from(citizenComplaints).where(and(eq(citizenComplaints.status, "açık"), lte(citizenComplaints.dueAt, new Date())));
  return {
    vehicleCount: Number(vehicleCount?.count ?? 0),
    activeShiftCount: Number(activeShiftCount?.count ?? 0),
    pendingWasteCount: Number(pendingWasteCount?.count ?? 0),
    overdueComplaintCount: Number(overdueComplaintCount?.count ?? 0),
  };
}

// -----------------------------------------------------------------------------
// RESET / ANALYTICS DATA MANAGEMENT (YÖNETİM VERİ SIFIRLAMA)
// -----------------------------------------------------------------------------
export async function resetOperationalData(options: {
  shifts?: boolean;
  waste?: boolean;
  containers?: boolean;
  complaints?: boolean;
  faults?: boolean;
  auditLogs?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");

  if (options.shifts) {
    await db.delete(shifts);
  }
  if (options.waste) {
    await db.delete(bulkWasteReports);
  }
  if (options.containers) {
    await db.delete(containerFaults);
  }
  if (options.complaints) {
    await db.delete(citizenComplaints);
  }
  if (options.faults) {
    await db.delete(vehicleFaults);
  }
  if (options.auditLogs) {
    await db.delete(auditLogs);
  }
}
