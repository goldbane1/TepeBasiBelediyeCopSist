import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { hashPassword, verifyPassword } from "./local-auth";
import { sdk } from "./_core/sdk";
import { operationsRouter } from "./routers/operations";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    setupStatus: publicProcedure.query(async () => ({ ready: await db.hasLocalManagementAccount() })),
    createInitialAdmin: publicProcedure.input(z.object({
      username: z.string().trim().toLowerCase().min(2).max(64),
      password: z.string().min(3).max(128),
      name: z.string().min(2),
    })).mutation(async ({ ctx, input }) => {
      const hasAdmin = await db.hasLocalManagementAccount();
      if (hasAdmin) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Yönetici hesabı zaten mevcut." });
      }
      const user = await db.createLocalManagedUser({
        name: input.name,
        username: input.username,
        passwordHash: await hashPassword(input.password),
        role: "yönetim",
      });
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Hesap oluşturulamadı." });
      const token = await sdk.createSessionToken(user.openId, { name: user.name ?? input.username });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 12 });
      return { user };
    }),
    login: publicProcedure.input(z.object({
      username: z.string().trim().toLowerCase().min(3).max(64),
      password: z.string().min(1).max(128),
    })).mutation(async ({ ctx, input }) => {
      const user = await db.getLocalUserByUsername(input.username);
      if (!user?.isLocalAccount || !user.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Kullanıcı adı veya şifre hatalı." });
      }
      const token = await sdk.createSessionToken(user.openId, { name: user.name ?? input.username });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 12 });
      return { user };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  operations: operationsRouter,
});

export type AppRouter = typeof appRouter;
