import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in .env");
}

const certificatePath = fileURLToPath(
  new URL("../../certs/supabase-ca.crt", import.meta.url)
);

const ca = readFileSync(certificatePath, "utf8");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca,
    rejectUnauthorized: true,
  },
  max: 5,
  connectionTimeoutMillis: 10000,
});