import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { userRouter } from "./user";
import { orderRouter } from "./order";
import { listingsRouter } from "./listings";

export const appRouter = createTRPCRouter({
  test: publicProcedure.query(async () => {
    return {
      status: "success",
    };
  }),
  user: userRouter,
  order: orderRouter,
  listings: listingsRouter,
});

export type AppRouter = typeof appRouter;