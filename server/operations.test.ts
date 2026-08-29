import { describe, expect, it } from "vitest";
import { firstOrNull, getShiftEligibility, getWasteFlowEligibility } from "./operations-db";
import { operationsRouter } from "./routers/operations";
import type { TrpcContext } from "./_core/context";

describe("mesai başlangıç uygunluğu", () => {
  it("açık mesai bulunmadığında null döndürür", () => {
    expect(firstOrNull([])).toBeNull();
  });

  it("aktif ve arıza kaydı olmayan araçta mesaiye izin verir", () => {
    expect(getShiftEligibility("aktif", 0)).toEqual({ allowed: true });
  });

  it("arızalı araçta mesaiyi engeller", () => {
    expect(getShiftEligibility("arızalı", 0)).toMatchObject({ allowed: false });
  });

  it("kademe onayı bekleyen arızada mesaiyi engeller", () => {
    expect(getShiftEligibility("aktif", 1)).toMatchObject({ allowed: false });
  });

  it("damperlik atık bildirimi için aktif mesaiyi (çöp kamyonu veya damperli kamyon) kabul eder", () => {
    expect(getWasteFlowEligibility({ vehicleId: 5, vehicleType: "çöp kamyonu" }, "herhangi")).toEqual({ allowed: true });
    expect(getWasteFlowEligibility({ vehicleId: 5, vehicleType: "damperli kamyon" }, "herhangi")).toEqual({ allowed: true });
    expect(getWasteFlowEligibility(null, "herhangi")).toMatchObject({ allowed: false });
  });

  it("toplama kaydını aktif damperli aracına bağlar", () => {
    expect(getWasteFlowEligibility({ vehicleId: 7, vehicleType: "damperli kamyon" }, "damperli kamyon", 7)).toEqual({ allowed: true });
    expect(getWasteFlowEligibility({ vehicleId: 7, vehicleType: "damperli kamyon" }, "damperli kamyon", 6)).toMatchObject({ allowed: false });
  });

});

describe("araç envanteri yetkileri", () => {
  it("şoför rolünün araç ekleme ve silme isteğini reddeder", async () => {
    const now = new Date();
    const ctx: TrpcContext = {
      user: {
        id: 9,
        openId: "local:sofor",
        name: "Test Şoför",
        email: null,
        loginMethod: "local",
        username: "sofor",
        passwordHash: "hash",
        isLocalAccount: true,
        role: "şoför",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      },
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = operationsRouter.createCaller(ctx);

    await expect(caller.vehicles.create({ type: "çöp kamyonu", capacityTon: "12", brand: "Mercedes", plate: "26 TB 101", status: "aktif" })).rejects.toThrow("yetkiniz bulunmuyor");
    await expect(caller.vehicles.remove({ id: 1 })).rejects.toThrow("yetkiniz bulunmuyor");
    await expect(caller.users.create({ name: "Yeni Şoför", username: "yeni.sofor", password: "GuvenliSifre2026!", role: "şoför" })).rejects.toThrow("yetkiniz bulunmuyor");
    await expect(caller.photos.deleteSingle({ entityType: "waste", entityId: 1, photoUrl: "/uploads/test.jpg" })).rejects.toThrow("yetkiniz bulunmuyor");
    await expect(caller.photos.purge({ scope: "all" })).rejects.toThrow("yetkiniz bulunmuyor");
  });
});

