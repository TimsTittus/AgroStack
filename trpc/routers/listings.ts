import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const listingsRouter = createTRPCRouter({
  getAllListings: protectedProcedure.query(async () => {
    const data = await db.select().from(listings).orderBy(listings.createdAt);
    return data;
  }),
  getFarmerListings: protectedProcedure.query(async ({ ctx }) => {
    const data = await db.select().from(listings).where(eq(listings.userid, ctx.auth?.user?.id as string)).orderBy(listings.createdAt);
    return data;
  }),
});
