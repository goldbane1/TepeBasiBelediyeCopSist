import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("yerel hesap provisioning güvenliği", () => {
  it("anonim ilk hesap oluşturma yordamını yayınlamaz", () => {
    const procedures = appRouter._def.procedures as Record<string, unknown>;

    expect(procedures["auth.bootstrap"]).toBeUndefined();
    expect(procedures["auth.login"]).toBeDefined();
  });
});
