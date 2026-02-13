import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";
import { headers } from "next/headers";
import { db } from "@/db";
import { auth } from "@/lib/auth";


export const createTRPCContext = cache(async (opts?: { req?: Request }) => {
  const heads = new Headers(opts?.req?.headers ?? (await headers()));

  const authSession = await auth.api.getSession({
    headers: heads,
  });

  return {
    auth: authSession,
    db,
  };
});

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.auth?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }

  return next();
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);