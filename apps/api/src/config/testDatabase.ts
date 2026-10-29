import { pool } from "./database.js";

async function testConnection() {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS server_time"
    );

    console.log("GYNECAIRE PostgreSQL connected successfully!");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testConnection();