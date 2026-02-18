import { createTRPCRouter, publicProcedure } from "../init";
import { facebook_getAccessToken } from "@/platform/facebook/core";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const facebookRouter = createTRPCRouter({
  facebookCallback: publicProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { token, pages } = await facebook_getAccessToken(input.code);
      if (!token.access_token) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      console.log(pages);
    }),
});
