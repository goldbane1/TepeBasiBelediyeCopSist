import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { storagePut } from "../storage";
import * as db from "../operations-db";
import { createLocalManagedUser, deleteManagedUser, listManagedUsers } from "../db";
import { hashPassword } from "../local-auth";
import { protectedProcedure, router } from "../_core/trpc";

const staffRole = z.enum(["şoför", "kademe personeli", "kaynak personeli", "yönetim"]);
const vehicleType = z.enum(["çöp kamyonu", "damperli kamyon"]);
const fullness = z.enum(["boş", "dolu"]);

function requireRole(role: z.infer<typeof staffRole>, allowed: z.infer<typeof staffRole>[]) {
  if (!allowed.includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu işlem için yetkiniz bulunmuyor." });
  }
}

async function uploadImage(dataUrl: string | undefined, prefix: string) {
  if (!dataUrl) return undefined;
  const [metadata, encoded] = dataUrl.split(",");
  if (!encoded || !metadata?.startsWith("data:image/")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Yalnızca görsel dosyası yüklenebilir." });
  }
  const mime = metadata.match(/data:(.*?);base64/)?.[1] ?? "image/jpeg";
  const extension = mime.split("/")[1] ?? "jpg";
  const uploaded = await storagePut(`${prefix}/${Date.now()}.${extension}`, Buffer.from(encoded, "base64"), mime);
  return uploaded.url;
}

async function audit(userId: number, action: string, entityType: string, entityId?: number, details?: string) {
  await db.addAuditLog({ actorId: userId, action, entityType, entityId, details });
}

export const operationsRouter = router({
  summary: protectedProcedure.query(() => db.getOperationalSummary()),
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
  shifts: router({
    list: protectedProcedure.query(({ ctx }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      return db.listShifts();
    }),
    current: protectedProcedure.query(({ ctx }) => {
      return db.getCurrentShiftForDriver(ctx.user.id);
    }),
    eligibility: protectedProcedure.input(z.object({ vehicleId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      return db.getVehicleShiftEligibility(input.vehicleId);
    }),
    start: protectedProcedure.input(
      z.object({
        vehicleId: z.number().int().positive(),
        region: z.string().min(2),
        neighborhood: z.string().min(2),
        vehicleType,
        startKm: z.number().int().nonnegative(),
        startFullness: fullness,
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      await db.startShift({ driverId: ctx.user.id, ...input, status: "açık" });
      await audit(ctx.user.id, "MESAİ_BAŞLATILDI", "mesai", undefined, `${input.neighborhood} / ${input.startKm} km`);
      return { success: true };
    }),
    finish: protectedProcedure.input(
      z.object({
        shiftId: z.number().int().positive(),
        endKm: z.number().int().nonnegative(),
        endFullness: fullness,
        tonnage: z.string().optional(),
        faultReported: z.boolean(),
        tonnageReceipt: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      const receiptUrl = await uploadImage(input.tonnageReceipt, `shifts/${ctx.user.id}`);
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
  }),
  vehicleFaults: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.listVehicleFaults();
    }),
    create: protectedProcedure.input(
      z.object({
        vehicleId: z.number().int().positive(),
        description: z.string().min(2),
        severity: z.enum(["düşük", "orta", "yüksek"]).default("orta"),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "kademe personeli", "kaynak personeli", "yönetim"]);
      await db.createVehicleFault({ ...input, reportedBy: ctx.user.id, status: "kademe_onayı_bekliyor" });
      await audit(ctx.user.id, "ARAÇ_ARIZASI_BİLDİRİLDİ", "araç_arızası", undefined, input.description);
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
  bulkWaste: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.listBulkWasteReports();
    }),
    create: protectedProcedure.input(
      z.object({
        region: z.string().min(2),
        neighborhood: z.string().min(2),
        wasteType: z.string().min(2),
        description: z.string().min(2),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        dueAt: z.date(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      if (ctx.user.role === "şoför") {
        await db.requireActiveWasteShift(ctx.user.id, "çöp kamyonu");
      }
      await db.createBulkWasteReport({
        ...input,
        latitude: String(input.latitude),
        longitude: String(input.longitude),
        reportedBy: ctx.user.id,
        status: "bekliyor",
      });
      await audit(ctx.user.id, "DAMPERLİK_ATIK_BİLDİRİLDİ", "damperlik_atık", undefined, input.wasteType);
      return { success: true };
    }),
    collect: protectedProcedure.input(
      z.object({ id: z.number().int().positive(), vehicleId: z.number().int().positive() })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      if (ctx.user.role === "şoför") {
        await db.requireActiveWasteShift(ctx.user.id, "damperli kamyon", input.vehicleId);
      }
      await db.collectBulkWaste(input.id, input.vehicleId, ctx.user.id);
      await audit(ctx.user.id, "DAMPERLİK_ATIK_TOPLANDI", "damperlik_atık", input.id);
      return { success: true };
    }),
  }),
  containerFaults: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.listContainerFaults();
    }),
    create: protectedProcedure.input(
      z.object({
        region: z.string().min(2),
        neighborhood: z.string().min(2),
        faultType: z.enum(["kol", "ayak", "gövde", "kapak", "diğer"]),
        description: z.string().min(2),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "kaynak personeli", "yönetim"]);
      await db.createContainerFault({
        ...input,
        latitude: String(input.latitude),
        longitude: String(input.longitude),
        reportedBy: ctx.user.id,
        status: "bekliyor",
      });
      await audit(ctx.user.id, "KONTEYNER_ARIZASI_BİLDİRİLDİ", "konteyner_arızası", undefined, input.faultType);
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
  }),
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
        dueAt: z.date(),
        photo: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["şoför", "yönetim"]);
      const photoUrl = await uploadImage(input.photo, `complaints/${ctx.user.id}`);
      await db.createCitizenComplaint({
        region: input.region,
        neighborhood: input.neighborhood,
        description: input.description,
        latitude: String(input.latitude),
        longitude: String(input.longitude),
        dueAt: input.dueAt,
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
  }),
  reports: router({
    auditLogs: protectedProcedure.query(({ ctx }) => {
      requireRole(ctx.user.role, ["yönetim"]);
      return db.listAuditLogs();
    }),
  }),
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
