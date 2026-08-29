import { TRPCError } from "@trpc/server";
import { z } from "zod";
import sharp from "sharp";
import { storageDelete, storagePut } from "../storage";
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

    const rawBuffer = Buffer.from(encoded, "base64");
    let finalBuffer: Buffer = rawBuffer;

    try {
      finalBuffer = await sharp(rawBuffer)
        .rotate()
        .resize(1400, 1400, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 75, progressive: true })
        .toBuffer();
    } catch (sharpErr) {
      console.warn("Sharp image compression skipped:", sharpErr);
      finalBuffer = rawBuffer;
    }

    // TiDB / veritabanında kalıcı saklamak için optimize edilmiş dataURL
    const optimizedDataUrl = `data:image/jpeg;base64,${finalBuffer.toString("base64")}`;

    // İsteğe bağlı yerel/bulut depolama kaydı (arka planda)
    try {
      await storagePut(`${prefix}/${Date.now()}.jpg`, finalBuffer, "image/jpeg");
    } catch {
      // ignore
    }

    return optimizedDataUrl;
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
        nextOilMaintenanceKm: z.number().int().positive().nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim", "kademe personeli"]);
      await db.createVehicle(input);
      await audit(ctx.user.id, "ARAÇ_OLUŞTURULDU", "araç", undefined, input.plate);
      return { success: true };
    }),
    update: protectedProcedure.input(
      z.object({
        id: z.number().int().positive(),
        type: vehicleType.optional(),
        capacityTon: z.string().optional(),
        brand: z.string().optional(),
        plate: z.string().optional(),
        status: z.enum(["aktif", "arızalı", "bakımda"]).optional(),
        nextOilMaintenanceKm: z.number().int().nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim", "kademe personeli"]);
      const { id, ...data } = input;
      await db.updateVehicle(id, data);
      await audit(ctx.user.id, "ARAÇ_GÜNCELLENDİ", "araç", id, JSON.stringify(data));
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
    switchVehicle: protectedProcedure.input(
      z.object({
        shiftId: z.number().int().positive(),
        newVehicleId: z.number().int().positive(),
        reason: z.string().trim().max(255).optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      const res = await db.switchShiftVehicle(input.shiftId, input.newVehicleId, input.reason);
      await audit(
        ctx.user.id,
        "MESAİ_ARAÇ_DEĞİŞTİRİLDİ",
        "mesai",
        input.shiftId,
        `Yeni Araç: ${res.newVehicle.plate} (${res.newVehicle.type}) ${input.reason ? `· Sebep: ${input.reason}` : ""}`
      );
      return { success: true, vehicle: res.newVehicle };
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
      z.object({
        id: z.number().int().positive(),
        vehicleId: z.number().int().positive(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);

      const report = await db.getBulkWasteReportById(input.id);
      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Damperlik atık kaydı bulunamadı." });
      }

      if (ctx.user.role === "şoför") {
        await db.requireActiveWasteShift(ctx.user.id, "damperli kamyon", input.vehicleId);

        if (input.latitude === undefined || input.longitude === undefined) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Konum bilginiz alınamadı. Atığı toplayabilmek için cihazınızın konum iznini açarak atık noktasına en fazla 175 metre mesafede olmalısınız.",
          });
        }

        const reportLat = parseFloat(report.latitude);
        const reportLon = parseFloat(report.longitude);

        if (!isNaN(reportLat) && !isNaN(reportLon)) {
          const distance = db.calculateDistanceMeters(input.latitude, input.longitude, reportLat, reportLon);
          if (distance > 175) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Atığı toplayabilmek için atık noktasına en fazla 175 metre mesafede olmalısınız! (Şu anki mesafeniz: ${distance} metre)`,
            });
          }
        }
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
      requireRole(ctx.user.role, ["kaynak personeli", "yönetim"]);
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
      requireRole(ctx.user.role, ["yönetim"]);
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
    resolve: protectedProcedure.input(
      z.object({
        id: z.number().int().positive(),
        photo: z.string().min(1, "Çözüm fotoğrafı yüklemek zorunludur."),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      const photoUrl = await uploadImage(input.photo, `complaints-resolved/${ctx.user.id}`);
      if (!photoUrl) throw new Error("Çözüm fotoğrafı yüklenemedi.");
      await db.resolveCitizenComplaint(input.id, ctx.user.id, photoUrl);
      await audit(ctx.user.id, "VATANDAŞ_ŞİKAYETİ_ÇÖZÜLDÜ_ONAY_BEKLİYOR", "vatandaş_şikayeti", input.id);
      return { success: true };
    }),
    approve: protectedProcedure.input(
      z.object({ id: z.number().int().positive() })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      await db.approveCitizenComplaint(input.id, ctx.user.id);
      await audit(ctx.user.id, "VATANDAŞ_ŞİKAYETİ_YÖNETİCİ_ONAYLADI", "vatandaş_şikayeti", input.id);
      return { success: true };
    }),
    reject: protectedProcedure.input(
      z.object({ id: z.number().int().positive() })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      const oldPhotoUrl = await db.rejectCitizenComplaint(input.id, ctx.user.id);
      if (oldPhotoUrl) {
        await storageDelete(oldPhotoUrl);
      }
      await audit(ctx.user.id, "VATANDAŞ_ŞİKAYETİ_YÖNETİCİ_REDDETTİ", "vatandaş_şikayeti", input.id);
      return { success: true };
    }),

    acknowledge: protectedProcedure.input(
      z.object({ id: z.number().int().positive(), photo: z.string().optional() })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      if (ctx.user.role === "yönetim") {
        await db.approveCitizenComplaint(input.id, ctx.user.id);
        await audit(ctx.user.id, "VATANDAŞ_ŞİKAYETİ_ONAYLANDI", "vatandaş_şikayeti", input.id);
      } else {
        if (!input.photo) throw new Error("Çözüm fotoğrafı yüklemek zorunludur.");
        const photoUrl = await uploadImage(input.photo, `complaints-resolved/${ctx.user.id}`);
        if (!photoUrl) throw new Error("Çözüm fotoğrafı yüklenemedi.");
        await db.resolveCitizenComplaint(input.id, ctx.user.id, photoUrl);
        await audit(ctx.user.id, "VATANDAŞ_ŞİKAYETİ_ÇÖZÜLDÜ_ONAY_BEKLİYOR", "vatandaş_şikayeti", input.id);
      }
      return { success: true };
    }),
    update: protectedProcedure.input(
      z.object({
        id: z.number().int().positive(),
        description: z.string().optional(),
        status: z.enum(["açık", "onay_bekliyor", "onaylandı"]).optional(),
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
        photosScope: z.enum(["today", "7days", "30days", "all"]).optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      const { photosScope, ...rest } = input;
      await db.resetOperationalData(rest);

      let deletedPhotosCount = 0;
      if (photosScope) {
        let days = 0;
        if (photosScope === "today") days = 1;
        else if (photosScope === "7days") days = 7;
        else if (photosScope === "30days") days = 30;
        else if (photosScope === "all") days = 0;

        const deletedUrls = await db.purgePhotosDb(days);
        deletedPhotosCount = deletedUrls.length;
        for (const url of deletedUrls) {
          await storageDelete(url);
        }
      }

      await audit(ctx.user.id, "ANALİZ_VERİLERİ_SIFIRLANDI", "analiz_yönetimi", undefined, JSON.stringify({ ...input, deletedPhotosCount }));
      return { success: true, deletedPhotosCount };
    }),
  }),

  // ---------------------------------------------------------------------------
  // PHOTOS MANAGEMENT (FOTOĞRAF YÖNETİMİ & SİLME)
  // ---------------------------------------------------------------------------
  photos: router({
    deleteSingle: protectedProcedure
      .input(
        z.object({
          entityType: z.enum(["shift", "waste", "container", "complaint"]),
          entityId: z.number().int().positive(),
          photoUrl: z.string().min(1),
          photoField: z.enum(["photoUrl", "repairPhotoUrl", "resolutionPhotoUrl"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["yönetim"]);
        let deletedUrls: string[] = [];

        if (input.entityType === "shift") {
          deletedUrls = await db.removeShiftReceiptPhoto(input.entityId, input.photoUrl);
        } else if (input.entityType === "waste") {
          deletedUrls = await db.removeBulkWastePhoto(input.entityId);
        } else if (input.entityType === "container") {
          deletedUrls = await db.removeContainerFaultPhoto(input.entityId);
        } else if (input.entityType === "complaint") {
          deletedUrls = await db.removeCitizenComplaintPhoto(input.entityId, (input.photoField as any) || "photoUrl");
        }


        for (const url of deletedUrls) {
          await storageDelete(url);
        }

        await audit(ctx.user.id, "FOTOĞRAF_SİLİNDİ", input.entityType, input.entityId, input.photoUrl);
        return { success: true, deletedCount: deletedUrls.length };
      }),

    purge: protectedProcedure
      .input(
        z.object({
          scope: z.enum(["today", "7days", "30days", "all"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["yönetim"]);
        let days = 0;
        if (input.scope === "today") days = 1;
        else if (input.scope === "7days") days = 7;
        else if (input.scope === "30days") days = 30;
        else if (input.scope === "all") days = 0;

        const deletedUrls = await db.purgePhotosDb(days);
        for (const url of deletedUrls) {
          await storageDelete(url);
        }

        await audit(ctx.user.id, "GÖRSELLER_TEMİZLENDİ", "depolama_yönetimi", undefined, `Kapsam: ${input.scope}, Silinen Görsel: ${deletedUrls.length}`);
        return { success: true, deletedCount: deletedUrls.length };
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
    updateMyProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).optional(),
          username: z.string().trim().toLowerCase().min(2).optional(),
          password: z.string().min(3).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const passwordHash = input.password && input.password.trim() ? await hashPassword(input.password) : undefined;
        await updateLocalManagedUser({
          openId: ctx.user.openId,
          name: input.name,
          username: input.username,
          passwordHash,
        });
        await audit(ctx.user.id, "KULLANICI_KENDİ_PROFİLİNİ_GÜNCELLEDİ", "kullanıcı", undefined, `${ctx.user.openId} / ${input.username || "şifre"}`);
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

