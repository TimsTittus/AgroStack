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

      // Log the input for debugging
      console.log("Recommendation request input:", JSON.stringify(input, null, 2));

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // Increased timeout

        const requestBody = {
          crop: input.crop.trim().toLowerCase(),
          current_price: Number(input.current_price),
          current_location: input.current_location.trim().toLowerCase(),
        };

        console.log("Sending to API:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(
          "http://13.200.207.204:8001/federated/recommend",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);

        const responseText = await response.text();
        console.log("API Response status:", response.status);
        console.log("API Response body:", responseText);

        if (!response.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `External API error (${response.status}): ${responseText}`,
          });
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to parse API response as JSON",
          });
        }

        // Handle different response formats
        if (data.recommendation) {
          return data.recommendation;
        }
        
        // If the response itself is the recommendation data
        if (data.suggested_price || data.market_trend || data.demand_level) {
          return data;
        }

        // Return the entire data object if structure is unknown
        return data;

      } catch (error) {
        console.error("Federated recommendation error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
          throw new TRPCError({
            code: "TIMEOUT",
            message: "Request to recommendation service timed out",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch recommendations",
        });
      }
    }),
});
