import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/index";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  trustedOrigins: ["*"],
  baseURL: process.env.BETTER_AUTH_BASE_URL,
  advanced: {
    cookiePrefix: "agroo",
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  sendOnSignUp: true,
  autoSignInAfterVerification: true,
  expiresIn: 3600,
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: null,
        input: true
      },
      phone: {
        type: 'string',
        required: true,
        defaultValue: null,
        input: true
      },
      wallet: {
        type: 'string',
        required: false,
        defaultValue: 0,
        input: true
      }
    }
  }
}
);