import { and, desc, eq, lte, sql } from "drizzle-orm";
import {
  auditLogs,
  bulkWasteReports,
  citizenComplaints,
  containerFaults,
  shifts,
  vehicleFaults,
  vehicles,
} from "../drizzle/schema";
import { getDb } from "./db";

export type ShiftEligibility = {
  allowed: boolean;
  reason?: string;
};

type ActiveShiftContext = { vehicleId: number; vehicleType: "çöp kamyonu" | "damperli kamyon" } | null | undefined;

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

export function getShiftEligibility(
  vehicleStatus: "aktif" | "arızalı" | "bakımda",
  pendingFaultCount: number,
): ShiftEligibility {
  if (vehicleStatus !== "aktif" || pendingFaultCount > 0) {
    return {
      allowed: false,
      reason: "Araçta kademe onayı bekleyen arıza kaydı bulunduğu için mesai başlatılamaz.",
    };
  }
  return { allowed: true };
}

export function firstOrNull<T>(items: T[]): T | null {
  return items[0] ?? null;
}

export async function listVehicles() {
  const db = await getDb();
  return db ? db.select().from(vehicles).orderBy(desc(vehicles.createdAt)) : [];
}

export async function createVehicle(data: typeof vehicles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.insert(vehicles).values(data);
}

export async function updateVehicleStatus(id: number, status: "aktif" | "arızalı" | "bakımda") {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(vehicles).set({ status }).where(eq(vehicles.id, id));
}

export async function deleteVehicle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  const activeShift = await db.select({ id: shifts.id }).from(shifts).where(and(eq(shifts.vehicleId, id), eq(shifts.status, "açık"))).limit(1);
  if (activeShift[0]) throw new Error("Açık mesaisi bulunan araç silinemez.");
  await db.delete(vehicles).where(eq(vehicles.id, id));
}

export async function getVehicleShiftEligibility(vehicleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1);
  if (!vehicle) throw new Error("Araç bulunamadı.");
  const pending = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicleFaults)
    .where(and(eq(vehicleFaults.vehicleId, vehicleId), eq(vehicleFaults.status, "kademe_onayı_bekliyor")));
  return getShiftEligibility(vehicle.status, Number(pending[0]?.count ?? 0));
}

export async function startShift(data: typeof shifts.$inferInsert) {
  const eligibility = await getVehicleShiftEligibility(data.vehicleId);
  if (!eligibility.allowed) throw new Error(eligibility.reason);
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.insert(shifts).values(data);
}

export async function finishShift(id: number, data: Partial<typeof shifts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(shifts).set({ ...data, status: "tamamlandı", endedAt: new Date() }).where(eq(shifts.id, id));
}

export async function listShifts() {
  const db = await getDb();
  return db ? db.select().from(shifts).orderBy(desc(shifts.startedAt)) : [];
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
  if (approved) await db.update(vehicles).set({ status: "aktif" }).where(eq(vehicles.id, fault.vehicleId));
}

export async function listBulkWasteReports() {
  const db = await getDb();
  return db ? db.select().from(bulkWasteReports).orderBy(desc(bulkWasteReports.createdAt)) : [];
}

export async function createBulkWasteReport(data: typeof bulkWasteReports.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.insert(bulkWasteReports).values(data);
}

export async function collectBulkWaste(id: number, vehicleId: number, driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(bulkWasteReports).set({ status: "toplandı", collectedVehicleId: vehicleId, collectedDriverId: driverId, collectedAt: new Date() }).where(eq(bulkWasteReports.id, id));
}

export async function listContainerFaults() {
  const db = await getDb();
  return db ? db.select().from(containerFaults).orderBy(desc(containerFaults.createdAt)) : [];
}

export async function createContainerFault(data: typeof containerFaults.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.insert(containerFaults).values(data);
}

export async function repairContainerFault(id: number, technicianId: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(containerFaults).set({ status: "onarım_tamamlandı", repairedBy: technicianId, repairNote: note ?? null, repairedAt: new Date() }).where(eq(containerFaults.id, id));
}

export async function listCitizenComplaints() {
  const db = await getDb();
  return db ? db.select().from(citizenComplaints).orderBy(desc(citizenComplaints.createdAt)) : [];
}

export async function createCitizenComplaint(data: typeof citizenComplaints.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.insert(citizenComplaints).values(data);
}

export async function acknowledgeCitizenComplaint(id: number, driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  await db.update(citizenComplaints).set({ status: "onaylandı", acknowledgedBy: driverId, acknowledgedAt: new Date() }).where(eq(citizenComplaints.id, id));
}

export async function addAuditLog(data: typeof auditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data);
}

export async function listAuditLogs() {
  const db = await getDb();
  return db ? db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100) : [];
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
