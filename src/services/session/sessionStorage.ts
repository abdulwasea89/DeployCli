import fs from 'fs';
import path from 'path';
import os from 'os';

interface SessionData {
    sessionToken: string;
    userId: string;
    userName: string;
    userEmail: string;
    savedAt: string;
}

const getSessionPath = (): string => {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.deploy-cli');

    // Create directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    return path.join(configDir, 'session.json');
};

export const sessionStorage = {
    saveSession: (sessionToken: string, userId: string, userName: string, userEmail: string): void => {
        const sessionData: SessionData = {
            sessionToken,
            userId,
            userName,
            userEmail,
            savedAt: new Date().toISOString()
        };

        try {
            fs.writeFileSync(getSessionPath(), JSON.stringify(sessionData, null, 2), 'utf-8');
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    },

    loadSession: (): SessionData | null => {
        try {
            const sessionPath = getSessionPath();
            if (!fs.existsSync(sessionPath)) {
                return null;
            }

            const data = fs.readFileSync(sessionPath, 'utf-8');
            return JSON.parse(data) as SessionData;
        } catch (error) {
            console.error('Failed to load session:', error);
            return null;
        }
    },

    clearSession: (): void => {
        try {
            const sessionPath = getSessionPath();
            if (fs.existsSync(sessionPath)) {
                fs.unlinkSync(sessionPath);
            }
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    },

    getSessionPath
};
