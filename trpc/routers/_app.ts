import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { userRouter } from "./user";
import { orderRouter } from "./order";
import { listingsRouter } from "./listings";
import { inventoryRouter } from "./inventory";
import { facebookRouter } from "./facebook";

export const appRouter = createTRPCRouter({
  test: publicProcedure.query(async () => {
    return {
      status: "success",
    };
  }),
  user: userRouter,
  order: orderRouter,
  listings: listingsRouter,
  inventory: inventoryRouter,
  facebook: facebookRouter,
});

export type AppRouter = typeof appRouter;