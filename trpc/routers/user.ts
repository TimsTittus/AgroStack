import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "@/db";
import { user,orders } from "@/db/schema";
import { eq, sql,and } from "drizzle-orm";
import z from "zod";

export const userRouter = createTRPCRouter({
  getPhone: protectedProcedure
    .input(z.object({ userid: z.string() }))
    .query(async ({ input }) => {
      const data = await db
        .select({ phone: user.phone })
        .from(user)
        .where(eq(user.id, input.userid));

      return data[0] ?? null;
    }),
    getSummary: protectedProcedure.query(async ({ ctx }) => {
      if(!ctx.auth) throw new Error("unauthorized");
    const userId = ctx.auth.user.id;
    const activeOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.buyerId, userId));
    const pendingResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        sql`${orders.buyerId} = ${userId} AND ${orders.status} = 'pending'`
      );
    const totalPurchasesResult = await db
      .select({
        total: sql<number>`coalesce(sum(${orders.price}::numeric), 0)`
      })
      .from(orders)
      .where(eq(orders.buyerId, userId));

    return {
      activeOrders: activeOrdersResult[0]?.count ?? 0,
      pendingDeliveries: pendingResult[0]?.count ?? 0,
      totalPurchases: totalPurchasesResult[0]?.total ?? 0,
      messages: 0,
    };
  }),
  getWalletInfo: protectedProcedure.query(async ({ ctx }) => {
  if (!ctx.auth) throw new Error("Unauthorized");

  const [wallet] = await db
    .select({ walletBalance: user.wallet })
    .from(user)
    .where(eq(user.id, ctx.auth.user.id));

  return wallet ?? null;
}),
getFarmerSummary: protectedProcedure.query(async ({ ctx }) => {
  if (!ctx.auth) throw new Error("unauthorized");
  const userId = ctx.auth.user.id;

  const revenue = await db
    .select({ total: sql<number>`coalesce(sum(${orders.price}::numeric), 0)` })
    .from(orders)
    .where(and(eq(orders.farmerId, userId), eq(orders.status, 'completed')));

  const pending = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(and(eq(orders.farmerId, userId), eq(orders.status, 'pending')));

  return {
    totalRevenue: revenue[0]?.total ?? 0,
    pendingOrders: pending[0]?.count ?? 0,
    activeListings: 0, 
  };
})
});
