import { betterAuth } from "better-auth";
import { Pool } from "pg";
import dotenv from "dotenv";
import { twoFactor, organization } from "better-auth/plugins";
import { auditLogger } from "../services/AuditLogger.ts";

dotenv.config();

export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.DATABASE_URL,
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        },
    },
    plugins: [
        twoFactor(),
        organization(),
    ],
    hooks: {
        after: async () => {
        }
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30 * 8, // 8 months
        updateAge: 60 * 60 * 24 * 1, // 1 day
    },
    trustedOrigins: ["http://localhost:3000"],
});
