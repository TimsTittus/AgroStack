import { inngest } from "./client";
import { facebook_createPost } from "@/platform/facebook/core";

const facebookPoster = inngest.createFunction(
  { id: "facebook-poster" },
  { cron: "0 * * * *" },
  async ({ event, step }) => {
    await facebook_createPost(process.env.FACEBOOK_PAGE_ACCESS_TOKEN!, "Hello");
    return { message: `Hello ${event.data.email}!` };
  },
);

export const functions = [facebookPoster];