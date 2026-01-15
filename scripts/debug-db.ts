import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        console.log("Checking tables...");
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables:", tables.rows.map(r => r.table_name));

        const authCodes = await pool.query("SELECT * FROM auth_codes ORDER BY created_at DESC LIMIT 5");
        console.log("\nRecent Auth Codes:", JSON.stringify(authCodes.rows, null, 2));

        if (tables.rows.some(r => r.table_name === 'session')) {
            const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'session'");
            console.log("\nSession Columns:", columns.rows.map(r => r.column_name));
            
            const sessions = await pool.query("SELECT * FROM session ORDER BY \"expiresAt\" DESC LIMIT 5");
            console.log("\nRecent Sessions:", JSON.stringify(sessions.rows, null, 2));
        } else {
            console.log("\n'session' table not found!");
        }

        if (tables.rows.some(r => r.table_name === 'user')) {
             const users = await pool.query("SELECT * FROM \"user\" LIMIT 5");
             console.log("\nRecent Users:", JSON.stringify(users.rows, null, 2));
        }

    } catch (err) {
        console.error("Debug failed:", err);
    } finally {
        await pool.end();
    }
}

main();
