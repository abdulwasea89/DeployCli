import { authService } from "../src/services/auth/authService.ts";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        const code = await authService.generateCode();
        console.log(`GENERATED_CODE:${code}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
