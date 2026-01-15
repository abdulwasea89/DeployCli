import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { Message } from '../types/chat.ts';
import { APP_CONFIG } from '../../config/constants.ts';

export const getAIStream = async (messages: Message[]) => {
    const lastMessage = messages[messages.length - 1]
    const history = messages.slice(0, -1);

    return streamText({
        model: groq(APP_CONFIG.DEFAULT_MODEL),
        system: APP_CONFIG.PROMPTS.SYSTEM,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        providerOptions: {
            groq: {
                reasoningFormat: 'parsed'
            }
        }
    });
};
