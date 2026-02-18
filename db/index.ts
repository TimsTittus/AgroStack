import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL as string;

// Prevent creating multiple connections during Next.js dev hot-reloads
const globalForDb = globalThis as unknown as {
    client: ReturnType<typeof postgres> | undefined;
};

export const client =
    globalForDb.client ??
    postgres(connectionString, { prepare: false, max: 5 });

if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });