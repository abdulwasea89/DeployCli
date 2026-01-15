import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { AuthState, IAuthStorage } from './types.ts';

export class FileStorage implements IAuthStorage {
    private configDir: string;

    constructor() {
        this.configDir = path.join(os.homedir(), '.deploy-cli');
    }

    private async ensureDir() {
        try {
            await fs.access(this.configDir);
        } catch {
            await fs.mkdir(this.configDir, { recursive: true });
        }
    }

    private getPath(profile: string): string {
        return path.join(this.configDir, `session.${profile}.json`);
    }

    async save(profile: string, state: AuthState): Promise<void> {
        await this.ensureDir();
        const filePath = this.getPath(profile);
        await fs.writeFile(filePath, JSON.stringify(state, null, 2), {
            encoding: 'utf-8',
            mode: 0o600 // Restrictive permissions: read/write for owner only
        });
    }

    async load(profile: string): Promise<AuthState | null> {
        const filePath = this.getPath(profile);
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data) as AuthState;
        } catch {
            return null;
        }
    }

    async clear(profile: string): Promise<void> {
        const filePath = this.getPath(profile);
        try {
            await fs.unlink(filePath);
        } catch {
            // Ignore errors if file doesn't exist
        }
    }
}
