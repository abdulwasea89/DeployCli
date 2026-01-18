import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Message } from '../../types/chat.ts';

export interface ChatSession {
    id: string;
    name: string;
    date: string;
    messages: Message[];
}

export interface SessionMetadata {
    id: string;
    name: string;
    date: string;
}

export class HistoryService {
    private historyDir: string;

    constructor() {
        this.historyDir = path.join(os.homedir(), '.deploy-cli', 'history');
    }

    private async ensureDir() {
        try {
            await fs.access(this.historyDir);
        } catch {
            await fs.mkdir(this.historyDir, { recursive: true });
        }
    }

    private getPath(id: string): string {
        return path.join(this.historyDir, `${id}.json`);
    }

    async saveSession(session: ChatSession): Promise<void> {
        await this.ensureDir();
        const filePath = this.getPath(session.id);
        await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
    }

    async listSessions(): Promise<SessionMetadata[]> {
        await this.ensureDir();
        try {
            const files = await fs.readdir(this.historyDir);
            const sessions: SessionMetadata[] = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const content = await fs.readFile(path.join(this.historyDir, file), 'utf-8');
                        const data = JSON.parse(content) as ChatSession;
                        sessions.push({
                            id: data.id,
                            name: data.name,
                            date: data.date
                        });
                    } catch (e) {
                        console.error(`Failed to parse session file ${file}:`, e);
                    }
                }
            }

            // Sort by date descending
            return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch (e) {
            return [];
        }
    }

    async loadSession(id: string): Promise<ChatSession | null> {
        const filePath = this.getPath(id);
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data) as ChatSession;
        } catch {
            return null;
        }
    }

    async deleteSession(id: string): Promise<void> {
        const filePath = this.getPath(id);
        try {
            await fs.unlink(filePath);
        } catch {
            // Ignore if file doesn't exist
        }
    }
}

export const historyService = new HistoryService();
