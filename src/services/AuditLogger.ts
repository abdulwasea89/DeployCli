import * as fs from 'fs';
import * as nodePath from 'path';

export class AuditLogger {
    private static instance: AuditLogger;
    private logFile: string;

    private constructor() {
        this.logFile = nodePath.join(process.cwd(), 'security-audit.log');
    }

    public static getInstance(): AuditLogger {
        if (!AuditLogger.instance) {
            AuditLogger.instance = new AuditLogger();
        }
        return AuditLogger.instance;
    }

    public log(event: string, userId?: string, metadata?: any) {
        const entry = {
            timestamp: new Date().toISOString(),
            event,
            userId: userId || 'anonymous',
            metadata: metadata || {}
        };
        fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n', 'utf-8');
    }
}

export const auditLogger = AuditLogger.getInstance();
