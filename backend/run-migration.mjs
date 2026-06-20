import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

let poolConfig = {
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 5000,
};

if (process.env.DATABASE_URL) {
  const isLocalDb = process.env.DATABASE_URL.includes("localhost") || process.env.DATABASE_URL.includes("127.0.0.1");
  poolConfig.connectionString = process.env.DATABASE_URL;
  poolConfig.ssl = isLocalDb ? false : { rejectUnauthorized: false };
} else {
  poolConfig.host = process.env.DB_HOST || "localhost";
  poolConfig.port = process.env.DB_PORT || 5432;
  poolConfig.user = process.env.DB_USER || "postgres";
  poolConfig.password = process.env.DB_PASSWORD || "ashutosh";
  poolConfig.database = process.env.DB_NAME || "booking_db";
  poolConfig.ssl = false;
}

const pool = new pg.Pool(poolConfig);

async function runMigration() {
  console.log("Connecting to database...");
  console.log("URL:", process.env.DATABASE_URL ? "Set (hidden)" : "NOT SET");

  try {
    const client = await pool.connect();
    console.log("Connected successfully!");

    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log("Running schema migration...");
    await client.query(sql);
    console.log("Migration executed successfully!");
    client.release();
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Timeout after 30 seconds
setTimeout(() => {
  console.error("Migration timed out after 30 seconds");
  process.exit(1);
}, 30000);

runMigration();
