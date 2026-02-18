import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { userRouter } from "./user";
import { orderRouter } from "./order";
import { listingsRouter } from "./listings";
import { inventoryRouter } from "./inventory";
import { facebookRouter } from "./facebook";
import { messagingRouter } from "./messaging";
import { notificationsRouter } from "./notifications";

import { federatedRouter } from "./fed";
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
  fed: federatedRouter,
  facebook: facebookRouter,
  messaging: messagingRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;