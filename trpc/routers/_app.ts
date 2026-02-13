import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { productRouter } from "./products";
import { userRouter } from "./user";
export const appRouter = createTRPCRouter({
  test: publicProcedure.query(async () => {
    return {
      status: "success",
    };
  }),
  product: productRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;