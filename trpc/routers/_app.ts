import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { productRouter } from "./products";
export const appRouter = createTRPCRouter({
  test: publicProcedure.query(async () => {
    return {
      status: "success",
    };
  }),
  product: productRouter,
});

export type AppRouter = typeof appRouter;