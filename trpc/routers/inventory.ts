import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "@/db";
import { inventory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { fetchMarketPrice } from "@/lib/data";

export const inventoryRouter = createTRPCRouter({
  getMarketPrice: protectedProcedure
    .input(z.object({ cropId: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        const marketPrice = await fetchMarketPrice(input.cropId);
        return marketPrice;
      } catch (error) {
        console.error("Error fetching market price:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch market price",
        });
      }
    }),
  getInventory: protectedProcedure
    .query(async ({ ctx }) => {
      const inventoryItems = await db.select().from(inventory).where(eq(inventory.userId, ctx.auth?.user.id as string));
      return inventoryItems;
    }),
  addInventory: protectedProcedure
    .input(z.object({
      cropName: z.string().min(1),
      quantity: z.number().positive(),
      unit: z.string().min(1),
      marketPrice: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const inventoryItem = await db.insert(inventory).values({
        userId: ctx.auth?.user.id as string,
        cropId: input.cropName,
        quantity: input.quantity.toString(),
        unit: input.unit,
        marketPrice: input.marketPrice.toString(),
        isProfitable: false,
      });
      return inventoryItem;
    }),
  deleteInventory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await db
        .delete(inventory)
        .where(
          and(
            eq(inventory.id, input.id),
            eq(inventory.userId, ctx.auth?.user.id as string),
          ),
        );
      return deleted;
    }),
  modifyInventory: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        quantity: z.number().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await db
        .update(inventory)
        .set({ quantity: input.quantity.toString() })
        .where(
          and(
            eq(inventory.id, input.id),
            eq(inventory.userId, ctx.auth?.user.id as string),
          ),
        );
      return updated;
    }),
});