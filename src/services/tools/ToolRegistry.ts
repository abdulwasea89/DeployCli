import { Tool } from 'ai';

export class ToolRegistry {
    private static instance: ToolRegistry;
    private tools: Record<string, Tool> = {};

    private constructor() {}

    public static getInstance(): ToolRegistry {
        if (!ToolRegistry.instance) {
            ToolRegistry.instance = new ToolRegistry();
        }
        return ToolRegistry.instance;
    }

    public register(name: string, tool: Tool) {
        this.tools[name] = tool;
    }

    public getTools(): Record<string, Tool> {
        return { ...this.tools };
    }

    public getTool(name: string): Tool | undefined {
        return this.tools[name];
    }
}

export const toolRegistry = ToolRegistry.getInstance();
