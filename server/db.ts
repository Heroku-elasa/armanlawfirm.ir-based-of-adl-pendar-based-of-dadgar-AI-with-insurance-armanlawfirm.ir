import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

const { Pool } = pg;

// Use AIVEN_DATABASE_URL if available, otherwise fallback to DATABASE_URL
// Fix: Use DATABASE_URL if AIVEN_DATABASE_URL is not configured correctly
const connectionString = (process.env.AIVEN_DATABASE_URL && !process.env.AIVEN_DATABASE_URL.includes('REPLACE_WITH_PASSWORD')) 
  ? process.env.AIVEN_DATABASE_URL 
  : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or AIVEN_DATABASE_URL must be set");
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });
