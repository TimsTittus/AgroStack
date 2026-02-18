import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { generateText, Output } from 'ai';
import { groq } from '@ai-sdk/groq';
import { TRPCError } from "@trpc/server";

export const listingsRouter = createTRPCRouter({
  getAllListings: protectedProcedure.query(async () => {
    const data = await db.select().from(listings).orderBy(listings.createdAt);
    return data;
  }),
  getListingsByUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const data = await db
        .select()
        .from(listings)
        .where(eq(listings.userid, input.userId))
        .orderBy(listings.createdAt);
      return data;
    }),
  getFarmerListings: protectedProcedure.query(async ({ ctx }) => {
    const data = await db
      .select()
      .from(listings)
      .where(eq(listings.userid, ctx.auth?.user?.id as string))
      .orderBy(listings.createdAt);
    return data;
  }),
  addListing: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        price: z.string().min(1, "Price is required"),
        quantity: z.string().min(1, "Quantity is required"),
        description: z.string().optional(),
        image: z.string().min(1, "Image URL is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.auth?.user?.id as string;

      const inserted = await db
        .insert(listings)
        .values({
          name: input.name,
          price: input.price,
          quantity: input.quantity,
          description: input.description ?? null,
          image: input.image,
          userid: userId,
        })
        .returning({ id: listings.id });

      return inserted[0]?.id ?? null;
    }),
  deleteListing: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.auth?.user?.id as string;

      const deleted = await db
        .delete(listings)
        .where(and(eq(listings.id, input.id), eq(listings.userid, userId)))
        .returning({ id: listings.id });

      if (!deleted.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found or you don't have permission to delete it.",
        });
      }

      return { success: true };
    }),
  generateSuggestion: protectedProcedure
    .input(
      z.object({
        price: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await generateText({
        model: groq('moonshotai/kimi-k2-instruct-0905'),
        output: Output.object({
          schema: z.object({
            suggestions: z.object({
              price: z.string(),
              quantity: z.string(),
              place: z.string()
            }),
            reasoning: z.string()
          }),
        }),
        system: "You are an expert agricultural consultant. Your task is to analyze the provided market data and generate optimal pricing and quantity suggestions with place for a farmer's listing. The suggestions should be based on current market trends, demand, and supply dynamics.",
        prompt: ``
      });

      return result.output;
    })
});