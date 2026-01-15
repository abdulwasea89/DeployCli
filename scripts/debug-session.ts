import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        const authCodes = await pool.query("SELECT * FROM auth_codes WHERE is_used = true ORDER BY created_at DESC LIMIT 1");
        if (authCodes.rows.length === 0) {
            console.log("No used auth codes found.");
            return;
        }

        const code = authCodes.rows[0];
        console.log(`Checking session for token: ${code.session_token}`);

        const session = await pool.query("SELECT * FROM session WHERE token = $1", [code.session_token]);
        if (session.rows.length > 0) {
            console.log("Session FOUND in database:", JSON.stringify(session.rows[0], null, 2));
        } else {
            console.log("Session NOT FOUND in database!");
            
            // Check all sessions to see what tokens look like
            const allSessions = await pool.query("SELECT token FROM session LIMIT 5");
            console.log("Existing tokens in 'session' table:", allSessions.rows.map(s => s.token));
        }

    } catch (err) {
        console.error("Debug failed:", err);
    } finally {
        await pool.end();
    }
}

main();
