export type ToolCall = {
    toolCallId: string;
    toolName: string;
    args: any;
};

export type ToolResult = {
    toolCallId: string;
    toolName: string;
    result: any;
};

export type Message = {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content?: string;
    reasoning?: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
};
