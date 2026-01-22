import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Pool } from "pg";
import { auth } from "../lib/auth.ts";
import { authService } from "../services/auth/authService.ts";
import { authInitiateLimiter, authPollLimiter, authValidateLimiter } from "../middleware/rateLimiter.ts";

const app = new Hono();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.use("*", cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    credentials: true,
}));

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

// Apply rate limiters to auth endpoints
app.post("/custom/auth/initiate", authInitiateLimiter, async (c) => {
    const code = await authService.generateCode();
    return c.json({
        code,
        url: `http://localhost:3000/login?CODE=${code}`
    });
});

app.post("/custom/auth/verify", async (c) => {
    const { code, userId, sessionToken } = await c.req.json();
    console.log(`Verify Request: code=${code}, userId=${userId}, hasToken=${!!sessionToken}`);
    
    if (!sessionToken) {
        console.warn(`Verify Rejected: No session token provided for code=${code}`);
        return c.json({ success: false, error: "No session token provided" }, 400);
    }

    const result = await authService.verifyCode(code, userId, sessionToken);
    if (result) {
        console.log(`Verify Success: code=${code}`);
        return c.json({ success: true });
    }
    
    console.warn(`Verify Failed: code=${code} not found, already matched, or expired`);
    return c.json({ success: false, error: "Invalid code or already used" }, 400);
});

app.get("/custom/auth/poll", authPollLimiter, async (c) => {
    const code = c.req.query("code");
    if (!code) return c.json({ error: "No code provided" }, 400);

    const result = await authService.checkStatus(code);
    if (result) {
        return c.json({
            authenticated: true,
            userId: result.user_id,
            sessionToken: result.session_token
        });
    }
    return c.json({ authenticated: false });
});

app.post("/custom/auth/validate", authValidateLimiter, async (c) => {
    const { sessionToken } = await c.req.json();
    if (!sessionToken) {
        return c.json({ valid: false, error: "No session token provided" }, 400);
    }

    try {
        console.log(`Validate Request: token=${sessionToken.substring(0, 5)}...`);
        
        // Query the session and user directly from the database for better reliability in the CLI flow
        // Note: Better Auth tables use double quotes for camelCase columns in Postgres
        const result = await pool.query(
            'SELECT s."expiresAt", u.id, u.name, u.email FROM session s JOIN "user" u ON s."userId" = u.id WHERE s.token = $1',
            [sessionToken]
        );

        if (result.rows.length > 0) {
            const row = result.rows[0];
            const now = new Date();
            const expiresAt = new Date(row.expiresAt);

            if (expiresAt > now) {
                console.log(`Validate Success: user=${row.email}`);
                return c.json({
                    valid: true,
                    user: {
                        id: row.id,
                        name: row.name,
                        email: row.email
                    }
                });
            } else {
                console.warn(`Validate Failed: Session expired for token: ${sessionToken.substring(0, 5)}...`);
                return c.json({ valid: false, error: "Session expired" });
            }
        }

        console.warn(`Validate Failed: No session found for token: ${sessionToken.substring(0, 5)}...`);
        return c.json({ valid: false, error: "Invalid or nonexistent session" });
    } catch (error: any) {
        console.error(`Validate Error: ${error.message}`, error);
        return c.json({ valid: false, error: "Session validation failed" }, 500);
    }
});

const port = 3001;
console.log(`Auth Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});
