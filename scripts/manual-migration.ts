
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Running manual migration...");

        // Add last_seen column
        await db.execute(sql`
            ALTER TABLE "user" 
            ADD COLUMN IF NOT EXISTS "last_seen" timestamp;
        `);
        console.log("Added last_seen column");

        // Add is_typing column
        await db.execute(sql`
            ALTER TABLE "user" 
            ADD COLUMN IF NOT EXISTS "is_typing" boolean DEFAULT false;
        `);
        console.log("Added is_typing column");

        console.log("Migration completed successfully");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

main();
