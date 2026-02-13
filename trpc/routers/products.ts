import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "@/db";
import { products } from "@/db/schema";

export const productRouter = createTRPCRouter({
  getProducts: protectedProcedure.query(async () => {
    const data = await db.select().from(products).orderBy(products.createdAt);
    return data;
  }),
});
