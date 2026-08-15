import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./local-auth";

describe("yerel parola güvenliği", () => {
  it("parolayı tek yönlü özetler ve doğru parola için doğrular", async () => {
    const password = "GuvenliSifre2026!";
    const hash = await hashPassword(password);

    expect(hash).not.toContain(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("yanlış parolayı reddeder", async () => {
    const hash = await hashPassword("GuvenliSifre2026!");
    await expect(verifyPassword("YanlisSifre2026!", hash)).resolves.toBe(false);
  });
});
