import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env", quiet: true });

export const db = drizzle(process.env.DATABASE_URL!);
