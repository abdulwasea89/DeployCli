import { useState } from 'react';
import { Message } from '../types/chat.ts';
import { getAIStream } from '../services/aiService.ts';

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState('Abdul');

    const handleLogin = () => {
        setIsLoggedIn(true);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Successfully authenticated. Reasoning model (GPT-OSS) is now active.' }]);
    };

    const sendMessage = async (value: string) => {
        if (!value.trim() || isProcessing) return;

        if (value.trim() === '/login') {
            handleLogin();
            return;
        }

        if (!isLoggedIn) {
            setMessages(prev => [
                ...prev,
                { role: 'user', content: value },
                { role: 'assistant', content: '⚠️  Please login to continue. Type /login' }
            ]);
            return;
        }

        const userMsg: Message = { role: 'user', content: value };
        setMessages(prev => [...prev, userMsg]);
        setIsProcessing(true);

        try {
            const { fullStream } = await getAIStream([...messages, userMsg]);

            // Add placeholder for the AI response
            setMessages(prev => [...prev, { role: 'assistant', content: '', reasoning: '' }]);

            for await (const part of fullStream) {
                if (part.type === 'reasoning-delta') {
                    setMessages(prev => {
                        const next = [...prev];
                        const last = next[next.length - 1];
                        if (last && last.role === 'assistant') {
                            last.reasoning = (last.reasoning || '') + part.text;
                        }
                        return next;
                    });
                } else if (part.type === 'text-delta') {
                    setMessages(prev => {
                        const next = [...prev];
                        const last = next[next.length - 1];
                        if (last && last.role === 'assistant') {
                            last.content = (last.content || '') + part.text;
                        }
                        return next;
                    });
                }
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        messages,
        isProcessing,
        isLoggedIn,
        user,
        sendMessage
    };
};
