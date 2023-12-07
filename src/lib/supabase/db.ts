import * as dotenv from "dotenv";
import * as schema from "../../../migrations/schema";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
    console.log("🔴 Cannot find database url");
}
const client = postgres(process.env.DATABASE_URL as string, {
    max: 1,
});

const db = drizzle(client, { schema });
const migrateDb = async () => {
    try {
        console.log("🚀 Migrating database");
        await migrate(db, {
            migrationsFolder: "migrations",
        });
        console.log("✅ Database migrated");
    } catch (e) {
        console.log("🔴 Error migrating database");
    }
};
migrateDb();
export default db;
