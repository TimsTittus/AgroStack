import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { productRouter } from "./products";
import { userRouter } from "./user";
import {orderRouter} from "./order"
export const appRouter = createTRPCRouter({
  test: publicProcedure.query(async () => {
    return {
      status: "success",
    };
  }),
  product: productRouter,
  user: userRouter,
  order: orderRouter,
});

export type AppRouter = typeof appRouter;