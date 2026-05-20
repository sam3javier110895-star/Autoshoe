import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";
export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema";
