import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { Message } from '../types/chat.ts';
import { APP_CONFIG } from '../../config/constants.ts';
import { toolRegistry } from './tools/ToolRegistry.ts';
import { metrics } from './metrics.ts';

// Force Tool Registration (Imports are needed to trigger static initialization)
import './tools/FileTools.ts';

export const getAIStream = async (messages: Message[], modelName?: string) => {
    const model = modelName || APP_CONFIG.DEFAULT_MODEL;
    const startTime = Date.now();
    
    try {
        const stream = streamText({
            model: groq(model),
            system: APP_CONFIG.PROMPTS.SYSTEM,
            messages: messages.map(m => {
                if (m.role === 'tool') {
                    return {
                        role: 'tool',
                        content: m.toolResults?.map(tr => ({
                            type: 'tool-result',
                            toolCallId: tr.toolCallId,
                            toolName: tr.toolName,
                            result: tr.result
                        }))
                    } as any;
                }
                return { 
                    role: m.role as any, 
                    content: m.content || '',
                    ...(m.toolCalls ? { toolCalls: m.toolCalls.map(tc => ({
                        type: 'function',
                        id: tc.toolCallId,
                        function: { name: tc.toolName, arguments: JSON.stringify(tc.args) }
                    })) } : {}),
                };
            }),
            tools: toolRegistry.getTools(),
            maxSteps: 10,
            providerOptions: {
                groq: {
                    reasoningFormat: 'parsed'
                }
            }
        } as any);
        
        // Record metrics (estimate tokens from message length)
        const estimatedTokens = messages.reduce((sum, m) => sum + Math.ceil((m.content || '').length / 4), 0);
        metrics.recordAICall(model, Date.now() - startTime, estimatedTokens);
        
        return stream;
    } catch (error) {
        metrics.recordAICall(model, Date.now() - startTime, 0, true);
        throw error;
    }
};
