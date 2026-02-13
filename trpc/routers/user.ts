import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
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
});
