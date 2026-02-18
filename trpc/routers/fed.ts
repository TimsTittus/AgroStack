import { createTRPCRouter, protectedProcedure } from "../init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const federatedRouter = createTRPCRouter({
  recommend: protectedProcedure
    .input(
      z.object({
        crop: z.string(),
        current_price: z.number(),
        current_location: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.auth) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
          "http://13.200.207.204:8001/federated/recommend",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(input),
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `External API error (${response.status}): ${errorText}`,
          });
        }

        const data = await response.json();

        if (!data || typeof data.recommendation === "undefined") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid response from recommendation service",
          });
        }

        return data.recommendation;

      } catch (error) {
        console.error("Federated recommendation error:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch recommendations",
        });
      }
    }),
});
