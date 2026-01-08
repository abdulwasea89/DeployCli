import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const authService = {
    async generateCode(userId?: string) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g., B7GD03JD
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
            "INSERT INTO auth_codes (code, user_id, expires_at) VALUES ($1, $2, $3)",
            [code, userId, expiresAt]
        );

        return code;
    },

    async verifyCode(code: string, userId: string, sessionToken?: string) {
        const result = await pool.query(
            "UPDATE auth_codes SET user_id = $2, session_token = $3, is_used = true WHERE code = $1 AND is_used = false AND expires_at > NOW() RETURNING *",
            [code, userId, sessionToken || null]
        );
        return result.rows[0];
    },

    async checkStatus(code: string) {
        const result = await pool.query(
            "SELECT user_id, session_token FROM auth_codes WHERE code = $1 AND is_used = true",
            [code]
        );
        return result.rows[0];
    }
};
