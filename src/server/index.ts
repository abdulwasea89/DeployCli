import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "../lib/auth.ts";
import { authService } from "../services/auth/authService.ts";

const app = new Hono();

app.use("*", cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    credentials: true,
}));

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.post("/custom/auth/initiate", async (c) => {
    const code = await authService.generateCode();
    return c.json({
        code,
        url: `http://localhost:3000/login?CODE=${code}`
    });
});

app.post("/custom/auth/verify", async (c) => {
    const { code, userId, sessionToken } = await c.req.json();
    const result = await authService.verifyCode(code, userId, sessionToken);
    if (result) {
        return c.json({ success: true });
    }
    return c.json({ success: false }, 400);
});

app.get("/custom/auth/poll", async (c) => {
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

app.post("/custom/auth/validate", async (c) => {
    const { sessionToken } = await c.req.json();
    if (!sessionToken) {
        return c.json({ valid: false, error: "No session token provided" }, 400);
    }

    try {
        // Use Better Auth's API to verify the session
        const session = await auth.api.getSession({
            headers: new Headers({
                'cookie': `better-auth.session_token=${sessionToken}`
            })
        });

        if (session?.user) {
            return c.json({
                valid: true,
                user: {
                    id: session.user.id,
                    name: session.user.name,
                    email: session.user.email
                }
            });
        }

        return c.json({ valid: false, error: "Invalid or expired session" });
    } catch (error) {
        return c.json({ valid: false, error: "Session validation failed" }, 500);
    }
});

const port = 3001;
console.log(`Auth Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});
