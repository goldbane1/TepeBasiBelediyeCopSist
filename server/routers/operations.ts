import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { storagePut } from "../storage";
import * as db from "../operations-db";
import { createLocalManagedUser, deleteManagedUser, listManagedUsers, updateLocalManagedUser } from "../db";
import { hashPassword } from "../local-auth";
import { protectedProcedure, router } from "../_core/trpc";

const staffRole = z.enum(["şoför", "kademe personeli", "kaynak personeli", "yönetim"]);
const vehicleType = z.enum(["çöp kamyonu", "damperli kamyon"]);
const fullness = z.enum(["boş", "dolu"]);
const shiftHoursEnum = z.enum(["08:00 - 16:00", "16:00 - 00:00", "00:00 - 08:00"]);

function requireRole(role: z.infer<typeof staffRole>, allowed: z.infer<typeof staffRole>[]) {
  if (!allowed.includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu işlem için yetkiniz bulunmuyor." });
  }
}

async function uploadImage(dataUrl: string | undefined, prefix: string) {
  if (!dataUrl) return undefined;
  try {
    const [metadata, encoded] = dataUrl.split(",");
    if (!encoded || !metadata?.startsWith("data:image/")) {
      return dataUrl;
    }
    const mime = metadata.match(/data:(.*?);base64/)?.[1] ?? "image/jpeg";
    const extension = mime.split("/")[1] ?? "jpg";
    const uploaded = await storagePut(`${prefix}/${Date.now()}.${extension}`, Buffer.from(encoded, "base64"), mime);
    return uploaded.url;
  } catch (err) {
    console.warn("Image upload storage error, fallback to data URL:", err);
    return dataUrl;
  }
}

async function audit(userId: number, action: string, entityType: string, entityId?: number, details?: string) {
  await db.addAuditLog({ actorId: userId, action, entityType, entityId, details });
}

async function uploadImages(dataUrlOrArray: string | string[] | undefined, prefix: string) {
  if (!dataUrlOrArray) return undefined;
  if (Array.isArray(dataUrlOrArray)) {
    if (dataUrlOrArray.length === 0) return undefined;
    const uploadedList: string[] = [];
    for (let i = 0; i < dataUrlOrArray.length; i++) {
      const uploaded = await uploadImage(dataUrlOrArray[i], `${prefix}_${i + 1}`);
      if (uploaded) uploadedList.push(uploaded);
    }
    return JSON.stringify(uploadedList);
  }
  return uploadImage(dataUrlOrArray, prefix);
}

export const operationsRouter = router({
  summary: protectedProcedure.query(() => db.getOperationalSummary()),

  // ---------------------------------------------------------------------------
  // NEIGHBORHOODS (MAHALLELER)
  // ---------------------------------------------------------------------------
  neighborhoods: router({
    list: protectedProcedure.query(async () => {
      return db.listNeighborhoods();
    }),
    create: protectedProcedure.input(
      z.object({
        region: z.string().min(2),
        name: z.string().min(2),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      await db.createNeighborhood(input);
      await audit(ctx.user.id, "MAHALLE_EKLENDİ", "mahalle", undefined, `${input.region} - ${input.name}`);
      return { success: true };
    }),
    update: protectedProcedure.input(
      z.object({
        id: z.number().int().positive(),
        region: z.string().min(2).optional(),
        name: z.string().min(2).optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      const { id, ...data } = input;
      await db.updateNeighborhood(id, data);
      await audit(ctx.user.id, "MAHALLE_GÜNCELLENDİ", "mahalle", id, `${data.region || ""} ${data.name || ""}`);
      return { success: true };
    }),
    remove: protectedProcedure.input(
      z.object({ id: z.number().int().positive() })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      await db.deleteNeighborhood(input.id);
      await audit(ctx.user.id, "MAHALLE_SİLİNDİ", "mahalle", input.id);
      return { success: true };
    }),
  }),

  // ---------------------------------------------------------------------------
  // VEHICLES (ARAÇLAR)
  // ---------------------------------------------------------------------------
  vehicles: router({
    list: protectedProcedure.query(() => db.listVehicles()),
    create: protectedProcedure.input(
      z.object({
        type: vehicleType,
        capacityTon: z.string().min(1),
        brand: z.string().min(1),
        plate: z.string().min(2),
        status: z.enum(["aktif", "arızalı", "bakımda"]).default("aktif"),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim", "kademe personeli"]);
      await db.createVehicle(input);
      await audit(ctx.user.id, "ARAÇ_OLUŞTURULDU", "araç", undefined, input.plate);
      return { success: true };
    }),
    updateStatus: protectedProcedure.input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["aktif", "arızalı", "bakımda"]),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim", "kademe personeli"]);
      await db.updateVehicleStatus(input.id, input.status);
      await audit(ctx.user.id, "ARAÇ_DURUMU_GÜNCELLENDİ", "araç", input.id, input.status);
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim", "kademe personeli"]);
      await db.deleteVehicle(input.id);
      await audit(ctx.user.id, "ARAÇ_SİLİNDİ", "araç", input.id);
      return { success: true };
    }),
  }),

  // ---------------------------------------------------------------------------
  // SHIFTS (MESAİLER)
  // ---------------------------------------------------------------------------
  shifts: router({
    list: protectedProcedure.query(({ ctx }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      return db.listShifts();
    }),
    current: protectedProcedure.query(({ ctx }) => {
      return db.getCurrentShiftForDriver(ctx.user.id);
    }),
    driverHistory: protectedProcedure.query(({ ctx }) => {
      return db.listDriverRecentShifts(ctx.user.id, 10);
    }),
    eligibility: protectedProcedure.input(z.object({ vehicleId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      return db.getVehicleShiftEligibility(input.vehicleId);
    }),
    start: protectedProcedure.input(
      z.object({
        driverId: z.number().int().positive().optional(),
        vehicleId: z.number().int().positive(),
        region: z.string().min(2),
        neighborhood: z.string().min(2),
        vehicleType,
        shiftHours: shiftHoursEnum.optional().default("08:00 - 16:00"),
        startKm: z.number().int().nonnegative(),
        startFullness: fullness,
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      const targetDriverId = (ctx.user.role === "yönetim" && input.driverId) ? input.driverId : ctx.user.id;
      await db.startShift({ ...input, driverId: targetDriverId, status: "açık" });
      await audit(ctx.user.id, "MESAİ_BAŞLATILDI", "mesai", undefined, `Şoför #${targetDriverId} · ${input.neighborhood} / Vardiya: ${input.shiftHours} / ${input.startKm} km`);
      return { success: true };
    }),
    finish: protectedProcedure.input(
      z.object({
        shiftId: z.number().int().positive(),
        endKm: z.number().int().nonnegative(),
        endFullness: fullness,
        tonnage: z.string().optional(),
        faultReported: z.boolean(),
        tonnageReceipt: z.union([z.string(), z.array(z.string())]).optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      const receiptUrl = await uploadImages(input.tonnageReceipt, `shifts/${ctx.user.id}`);
      await db.finishShift(input.shiftId, {
        endKm: input.endKm,
        endFullness: input.endFullness,
        tonnage: input.tonnage ?? null,
        tonnageReceiptUrl: receiptUrl ?? null,
        faultReported: input.faultReported,
      });
      await audit(ctx.user.id, "MESAİ_SONLANDIRILDI", "mesai", input.shiftId, `${input.endKm} km`);
      return { success: true };
    }),
    update: protectedProcedure.input(
      z.object({
        id: z.number().int().positive(),
        region: z.string().optional(),
        neighborhood: z.string().optional(),
        shiftHours: z.string().optional(),
        startKm: z.number().int().optional(),
        endKm: z.number().int().nullable().optional(),
        tonnage: z.string().nullable().optional(),
        status: z.enum(["açık", "tamamlandı"]).optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      const { id, ...data } = input;
      await db.updateShift(id, data as any);
      await audit(ctx.user.id, "MESAİ_GÜNCELLENDİ", "mesai", id, JSON.stringify(data));
      return { success: true };
    }),
    remove: protectedProcedure.input(
      z.object({ id: z.number().int().positive() })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      await db.deleteShift(input.id);
      await audit(ctx.user.id, "MESAİ_SİLİNDİ", "mesai", input.id);
      return { success: true };
    }),
  }),

  // ---------------------------------------------------------------------------
  // VEHICLE FAULTS (ARAÇ ARIZALARI)
  // ---------------------------------------------------------------------------
  vehicleFaults: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.listVehicleFaults();
    }),
    create: protectedProcedure.input(
      z.object({
        vehicleId: z.number().int().positive(),
        description: z.string().optional().default(""),
        severity: z.enum(["düşük", "orta", "yüksek"]).default("orta"),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "kademe personeli", "kaynak personeli", "yönetim"]);
      const desc = input.description?.trim() || "Açıklama belirtilmedi";
      await db.createVehicleFault({ ...input, description: desc, reportedBy: ctx.user.id, status: "kademe_onayı_bekliyor" });
      await audit(ctx.user.id, "ARAÇ_ARIZASI_BİLDİRİLDİ", "araç_arızası", undefined, desc);
      return { success: true };
    }),
    review: protectedProcedure.input(
      z.object({
        id: z.number().int().positive(),
        approved: z.boolean(),
        note: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["kademe personeli", "yönetim"]);
      await db.reviewVehicleFault(input.id, ctx.user.id, input.approved, input.note);
      await audit(ctx.user.id, input.approved ? "ARAÇ_ARIZASI_ONAYLANDI" : "ARAÇ_BAKIMA_ALINDI", "araç_arızası", input.id, input.note);
      return { success: true };
    }),
  }),

  // ---------------------------------------------------------------------------
  // BULK WASTE REPORTS (DAMPERLİK ATIK)
  // ---------------------------------------------------------------------------
  bulkWaste: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.listBulkWasteReports();
    }),
    create: protectedProcedure.input(
      z.object({
        region: z.string().min(2),
        neighborhood: z.string().min(2),
        wasteType: z.string().min(2),
        description: z.string().optional().default(""),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        durationHours: z.number().optional().default(48),
        requiresExcavator: z.boolean().optional().default(false),
        photo: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      if (ctx.user.role === "şoför") {
        await db.requireActiveWasteShift(ctx.user.id, "çöp kamyonu");
      }
      const photoUrl = await uploadImage(input.photo, `bulkWaste/${ctx.user.id}`);
      const hours = input.durationHours === 24 ? 24 : 48;
      const autoDueAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      const desc = input.description?.trim() || "Açıklama belirtilmedi";

      await db.createBulkWasteReport({
        region: input.region,
        neighborhood: input.neighborhood,
        wasteType: input.wasteType,
        description: desc,
        latitude: String(input.latitude),
        longitude: String(input.longitude),
        photoUrl: photoUrl ?? null,
        dueAt: autoDueAt,
        requiresExcavator: input.requiresExcavator ?? false,
        reportedBy: ctx.user.id,
        status: "bekliyor",
      });
      await audit(
        ctx.user.id,
        "DAMPERLİK_ATIK_BİLDİRİLDİ",
        "damperlik_atık",
        undefined,
        `${input.wasteType} - ${input.neighborhood} (${hours} saat${input.requiresExcavator ? " - Kepçe Gerekli" : ""})`
      );
      return { success: true };
    }),
    collect: protectedProcedure.input(
      z.object({ id: z.number().int().positive(), vehicleId: z.number().int().positive() })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim", "kademe personeli"]);
      if (ctx.user.role === "şoför") {
        await db.requireActiveWasteShift(ctx.user.id, "damperli kamyon", input.vehicleId);
      }
      await db.collectBulkWaste(input.id, input.vehicleId, ctx.user.id);
      await audit(ctx.user.id, "DAMPERLİK_ATIK_TOPLANDI", "damperlik_atık", input.id);
      return { success: true };
    }),
    update: protectedProcedure.input(
      z.object({
        id: z.number().int().positive(),
        wasteType: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["bekliyor", "toplandı"]).optional(),
        region: z.string().optional(),
        neighborhood: z.string().optional(),
        requiresExcavator: z.boolean().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      const { id, ...data } = input;
      await db.updateBulkWasteReport(id, data);
      await audit(ctx.user.id, "DAMPERLİK_ATIK_GÜNCELLENDİ", "damperlik_atık", id, JSON.stringify(data));
      return { success: true };
    }),
    remove: protectedProcedure.input(
      z.object({ id: z.number().int().positive() })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      await db.deleteBulkWasteReport(input.id);
      await audit(ctx.user.id, "DAMPERLİK_ATIK_SİLİNDİ", "damperlik_atık", input.id);
      return { success: true };
    }),
  }),

  // ---------------------------------------------------------------------------
  // CONTAINER FAULTS (KONTEYNER ARIZALARI)
  // ---------------------------------------------------------------------------
  containerFaults: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.listContainerFaults();
    }),
    create: protectedProcedure.input(
      z.object({
        region: z.string().min(2),
        neighborhood: z.string().min(2),
        faultType: z.enum(["kol", "ayak", "gövde", "kapak", "diğer"]),
        description: z.string().optional().default(""),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        photo: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "kaynak personeli", "yönetim"]);
      const photoUrl = await uploadImage(input.photo, `containers/${ctx.user.id}`);
      const desc = input.description?.trim() || "Açıklama belirtilmedi";
      await db.createContainerFault({
        region: input.region,
        neighborhood: input.neighborhood,
        faultType: input.faultType,
        description: desc,
        latitude: String(input.latitude),
        longitude: String(input.longitude),
        photoUrl: photoUrl ?? null,
        reportedBy: ctx.user.id,
        status: "bekliyor",
      });
      await audit(ctx.user.id, "KONTEYNER_ARIZASI_BİLDİRİLDİ", "konteyner_arızası", undefined, `${input.faultType} - ${desc}`);
      return { success: true };
    }),
    repair: protectedProcedure.input(
      z.object({ id: z.number().int().positive(), note: z.string().optional() })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["kaynak personeli", "yönetim", "şoför"]);
      await db.repairContainerFault(input.id, ctx.user.id, input.note);
      await audit(ctx.user.id, "KONTEYNER_ONARILDI", "konteyner_arızası", input.id, input.note);
      return { success: true };
    }),
    update: protectedProcedure.input(
      z.object({
        id: z.number().int().positive(),
        faultType: z.enum(["kol", "ayak", "gövde", "kapak", "diğer"]).optional(),
        description: z.string().optional(),
        status: z.enum(["bekliyor", "onarım_tamamlandı"]).optional(),
        repairNote: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      const { id, ...data } = input;
      await db.updateContainerFault(id, data);
      await audit(ctx.user.id, "KONTEYNER_ARIZASI_GÜNCELLENDİ", "konteyner_arızası", id, JSON.stringify(data));
      return { success: true };
    }),
    remove: protectedProcedure.input(
      z.object({ id: z.number().int().positive() })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      await db.deleteContainerFault(input.id);
      await audit(ctx.user.id, "KONTEYNER_ARIZASI_SİLİNDİ", "konteyner_arızası", input.id);
      return { success: true };
    }),
  }),

  // ---------------------------------------------------------------------------
  // CITIZEN COMPLAINTS (VATANDAŞ ŞİKAYETLERİ)
  // ---------------------------------------------------------------------------
  complaints: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.listCitizenComplaints();
    }),
    create: protectedProcedure.input(
      z.object({
        region: z.string().min(2),
        neighborhood: z.string().min(2),
        description: z.string().min(2),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        dueAt: z.date().optional(),
        photo: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      const photoUrl = await uploadImage(input.photo, `complaints/${ctx.user.id}`);
      const autoDueAt = input.dueAt ?? new Date(Date.now() + 48 * 60 * 60 * 1000);
      await db.createCitizenComplaint({
        region: input.region,
        neighborhood: input.neighborhood,
        description: input.description,
        latitude: String(input.latitude),
        longitude: String(input.longitude),
        dueAt: autoDueAt,
        photoUrl: photoUrl ?? null,
        reportedBy: ctx.user.id,
        status: "açık",
      });
      await audit(ctx.user.id, "VATANDAŞ_ŞİKAYETİ_BİLDİRİLDİ", "vatandaş_şikayeti", undefined, input.neighborhood);
      return { success: true };
    }),
    acknowledge: protectedProcedure.input(
      z.object({ id: z.number().int().positive() })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      await db.acknowledgeCitizenComplaint(input.id, ctx.user.id);
      await audit(ctx.user.id, "VATANDAŞ_ŞİKAYETİ_ONAYLANDI", "vatandaş_şikayeti", input.id);
      return { success: true };
    }),
    update: protectedProcedure.input(
      z.object({
        id: z.number().int().positive(),
        description: z.string().optional(),
        status: z.enum(["açık", "onaylandı"]).optional(),
        region: z.string().optional(),
        neighborhood: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      const { id, ...data } = input;
      await db.updateCitizenComplaint(id, data);
      await audit(ctx.user.id, "VATANDAŞ_ŞİKAYETİ_GÜNCELLENDİ", "vatandaş_şikayeti", id, JSON.stringify(data));
      return { success: true };
    }),
    remove: protectedProcedure.input(
      z.object({ id: z.number().int().positive() })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      await db.deleteCitizenComplaint(input.id);
      await audit(ctx.user.id, "VATANDAŞ_ŞİKAYETİ_SİLİNDİ", "vatandaş_şikayeti", input.id);
      return { success: true };
    }),
  }),

  // ---------------------------------------------------------------------------
  // AUDIT LOGS & REPORTS & DATA RESET
  // ---------------------------------------------------------------------------
  reports: router({
    auditLogs: protectedProcedure.query(({ ctx }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      return db.listAuditLogs();
    }),
    resetData: protectedProcedure.input(
      z.object({
        shifts: z.boolean().optional(),
        waste: z.boolean().optional(),
        containers: z.boolean().optional(),
        complaints: z.boolean().optional(),
        faults: z.boolean().optional(),
        auditLogs: z.boolean().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      await db.resetOperationalData(input);
      await audit(ctx.user.id, "ANALİZ_VERİLERİ_SIFIRLANDI", "analiz_yönetimi", undefined, JSON.stringify(input));
      return { success: true };
    }),
  }),

  // ---------------------------------------------------------------------------
  // USER MANAGEMENT (KULLANICI YÖNETİMİ)
  // ---------------------------------------------------------------------------
  users: router({
    list: protectedProcedure.query(({ ctx }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      return listManagedUsers();
    }),
    create: protectedProcedure.input(
      z.object({
        username: z.string().trim().toLowerCase().min(2).max(64),
        password: z.string().min(3).max(128),
        name: z.string().min(2),
        role: staffRole,
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      await createLocalManagedUser({
        name: input.name,
        username: input.username,
        passwordHash: await hashPassword(input.password),
        role: input.role,
      });
      await audit(ctx.user.id, "PERSONEL_HESABI_OLUŞTURULDU", "kullanıcı", undefined, `${input.name} / ${input.role}`);
      return { success: true };
    }),
    update: protectedProcedure.input(
      z.object({
        openId: z.string().min(4),
        name: z.string().min(2).optional(),
        username: z.string().trim().toLowerCase().min(2).optional(),
        password: z.string().min(3).optional(),
        role: staffRole.optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      const passwordHash = input.password && input.password.trim() ? await hashPassword(input.password) : undefined;
      await updateLocalManagedUser({
        openId: input.openId,
        name: input.name,
        username: input.username,
        passwordHash,
        role: input.role,
      });
      await audit(ctx.user.id, "PERSONEL_HESABI_GÜNCELLENDİ", "kullanıcı", undefined, `${input.openId} / ${input.role || "bilgi"}`);
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ openId: z.string().min(4) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      if (input.openId === ctx.user.openId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kendi hesabınızı bu ekrandan silemezsiniz." });
      }
      await deleteManagedUser(input.openId);
      await audit(ctx.user.id, "PERSONEL_HESABI_SİLİNDİ", "kullanıcı", undefined, input.openId);
      return { success: true };
    }),
  }),
});
