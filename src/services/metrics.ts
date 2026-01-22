/**
 * Metrics Service for Deploy CLI
 * Tracks tool executions, AI calls, and session statistics
 */

interface ToolMetric {
    count: number;
    totalDuration: number;
    errors: number;
    lastCalled: number;
}

interface AIMetric {
    count: number;
    totalDuration: number;
    errors: number;
    estimatedTokens: number;
}

interface MetricsData {
    tools: Record<string, ToolMetric>;
    ai: Record<string, AIMetric>;
    session: {
        startTime: number;
        messagesSent: number;
        messagesReceived: number;
    };
}

class MetricsService {
    private data: MetricsData;

    constructor() {
        this.data = {
            tools: {},
            ai: {},
            session: {
                startTime: Date.now(),
                messagesSent: 0,
                messagesReceived: 0
            }
        };
    }

    /**
     * Record a tool execution
     */
    recordToolCall(toolName: string, duration: number, error: boolean = false): void {
        if (!this.data.tools[toolName]) {
            this.data.tools[toolName] = {
                count: 0,
                totalDuration: 0,
                errors: 0,
                lastCalled: 0
            };
        }

        const tool = this.data.tools[toolName];
        tool.count++;
        tool.totalDuration += duration;
        tool.lastCalled = Date.now();
        if (error) tool.errors++;
    }

    /**
     * Record an AI API call
     */
    recordAICall(model: string, duration: number, estimatedTokens: number = 0, error: boolean = false): void {
        if (!this.data.ai[model]) {
            this.data.ai[model] = {
                count: 0,
                totalDuration: 0,
                errors: 0,
                estimatedTokens: 0
            };
        }

        const ai = this.data.ai[model];
        ai.count++;
        ai.totalDuration += duration;
        ai.estimatedTokens += estimatedTokens;
        if (error) ai.errors++;
    }

    /**
     * Record a message sent by user
     */
    recordMessageSent(): void {
        this.data.session.messagesSent++;
    }

    /**
     * Record a message received from AI
     */
    recordMessageReceived(): void {
        this.data.session.messagesReceived++;
    }

    /**
     * Get summary statistics
     */
    getSummary(): string {
        const uptime = Math.floor((Date.now() - this.data.session.startTime) / 1000);
        const uptimeStr = `${Math.floor(uptime / 60)}m ${uptime % 60}s`;

        const lines: string[] = [
            '📊 Session Metrics',
            '─'.repeat(40),
            `⏱️  Uptime: ${uptimeStr}`,
            `💬 Messages: ${this.data.session.messagesSent} sent / ${this.data.session.messagesReceived} received`,
            ''
        ];

        // Tool metrics
        const toolNames = Object.keys(this.data.tools);
        if (toolNames.length > 0) {
            lines.push('🛠️  Tool Usage:');
            for (const name of toolNames.sort()) {
                const t = this.data.tools[name];
                const avgDuration = t.count > 0 ? Math.round(t.totalDuration / t.count) : 0;
                lines.push(`   ${name}: ${t.count} calls (avg ${avgDuration}ms)${t.errors > 0 ? ` ⚠️ ${t.errors} errors` : ''}`);
            }
            lines.push('');
        }

        // AI metrics
        const modelNames = Object.keys(this.data.ai);
        if (modelNames.length > 0) {
            lines.push('🤖 AI Usage:');
            for (const model of modelNames) {
                const a = this.data.ai[model];
                const avgDuration = a.count > 0 ? Math.round(a.totalDuration / a.count) : 0;
                lines.push(`   ${model}: ${a.count} calls (avg ${avgDuration}ms)`);
                if (a.estimatedTokens > 0) {
                    lines.push(`      Est. tokens: ~${a.estimatedTokens.toLocaleString()}`);
                }
            }
        }

        return lines.join('\n');
    }

    /**
     * Get raw metrics data for export
     */
    getRawData(): MetricsData {
        return { ...this.data };
    }

    /**
     * Reset all metrics
     */
    reset(): void {
        this.data = {
            tools: {},
            ai: {},
            session: {
                startTime: Date.now(),
                messagesSent: 0,
                messagesReceived: 0
            }
        };
    }
}

// Singleton instance
export const metrics = new MetricsService();
