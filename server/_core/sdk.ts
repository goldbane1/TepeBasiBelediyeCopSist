import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { ENV } from "./env";

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.length > 0;

export const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

class LocalSessionServer {
  private getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  async createSessionToken(openId: string, options: { expiresInMs?: number; name?: string } = {}) {
    const expiresInMs = options.expiresInMs ?? TWELVE_HOURS_MS;
    return this.signSession({ openId, appId: ENV.appId, name: options.name || "" }, { ...options, expiresInMs });
  }

  async signSession(payload: SessionPayload, options: { expiresInMs?: number } = {}) {
    const expiresInMs = options.expiresInMs ?? TWELVE_HOURS_MS;
    const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);
    return new SignJWT({ openId: payload.openId, appId: payload.appId, name: payload.name })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(this.getSessionSecret());
  }


  async verifySession(cookieValue: string | undefined | null): Promise<SessionPayload | null> {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), { algorithms: ["HS256"] });
      const { openId, appId, name } = payload as Record<string, unknown>;
      if (!isNonEmptyString(openId) || typeof appId !== "string" || typeof name !== "string") return null;
      return { openId, appId, name };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const cookie = parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
    const session = await this.verifySession(cookie);
    if (!session) throw ForbiddenError("Geçerli bir yerel oturum bulunamadı.");
    const user = await db.getUserByOpenId(session.openId);
    if (!user?.isLocalAccount) throw ForbiddenError("Bu uygulama yalnızca yerel hesaplarla kullanılabilir.");
    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    return user;
  }
}

export type AuthenticatedUser = User;
export const sdk = new LocalSessionServer();
