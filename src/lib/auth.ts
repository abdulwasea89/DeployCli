import { betterAuth } from "better-auth";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.DATABASE_URL,
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30 * 8, // 8 months
        updateAge: 60 * 60 * 24 * 1, // 1 day
    },
    trustedOrigins: ["http://localhost:3000"],
});
