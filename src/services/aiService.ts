import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { Message } from '../types/chat.ts';
import { APP_CONFIG } from '../../config/constants.ts';
import * as tools from './tools/FileTools.ts';

export const getAIStream = async (messages: Message[], modelName?: string) => {
    return streamText({
        model: groq(modelName || APP_CONFIG.DEFAULT_MODEL),
        system: APP_CONFIG.PROMPTS.SYSTEM + `
- Use tools for file analysis, editing, and execution.
- Use 'readFile' for peeking, 'writeFile' to create/overwrite files, 'edit' for small changes.
- Use 'bash' for commands, 'todowrite' to track tasks and 'question' for clarification.
- ALWAYS verify file contents before editing.`,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        tools: {
            readFile: tools.readFile,
            writeFile: tools.writeFile,
            read: tools.read, // Compatibility alias
            grep: tools.grep,
            list: tools.list,
            find: tools.find,
            bash: tools.bash,
            edit: tools.edit,
            skill: tools.skill,
            todowrite: tools.todowrite,
            question: tools.question
        },
        maxSteps: 10,
        providerOptions: {
            groq: {
                reasoningFormat: 'parsed'
            }
        }
    } as any);
};
