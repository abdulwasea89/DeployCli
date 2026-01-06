import React, { useState } from 'react';
import { Message } from '../types/chat.ts';
import { getAIStream } from '../services/aiService.ts';
import fs from 'fs';
import path from 'path';

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState('Abdul');

    const handleLogin = () => {
        setIsLoggedIn(true);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Successfully authenticated. Reasoning model (GPT-OSS) is now active.' }]);
    };

    const sendMessage = React.useCallback(async (value: string) => {
        if (!value.trim() || isProcessing) return;

        const command = value.trim();

        if (command === '/login') {
            handleLogin();
            return;
        }

        if (command === '/clear' || command === '/reset') {
            setMessages([]);
            return;
        }

        if (command === '/exit') {
            process.exit(0);
        }

        if (command === '/help') {
            setMessages(prev => [
                ...prev,
                { role: 'user', content: value },
                { role: 'assistant', content: 'Available commands:\n/login - Sign in\n/clear - Clear chat\n/exit - Exit app\n/help - Show this message\n/history - View history\n/model - Switch model' }
            ]);
            return;
        }

        // Handle other client-side commands stub
        if (command.startsWith('/') && !command.includes(' ')) {
            setMessages(prev => [
                ...prev,
                { role: 'user', content: value },
                { role: 'assistant', content: `Command '${command}' not recognized or not implemented yet.` }
            ]);
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
            // Parse for @files
            const fileTokens = value.match(/@(\S+)/g) || [];
            let contextualMessages = [...messages, userMsg];

            if (fileTokens.length > 0) {
                const fileContexts = fileTokens.map(token => {
                    const fileName = token.slice(1);
                    try {
                        const content = fs.readFileSync(path.join(process.cwd(), fileName), 'utf-8');
                        return `--- FILE: ${fileName} ---\n${content}\n--- END FILE ---`;
                    } catch (e) {
                        return `--- FILE: ${fileName} (Error: Could not read file) ---`;
                    }
                }).join('\n\n');

                contextualMessages = [
                    { role: 'system', content: `The user has provided the following file context:\n\n${fileContexts}` },
                    ...messages,
                    userMsg
                ];
            }

            const { fullStream } = await getAIStream(contextualMessages);

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
    }, [isProcessing, isLoggedIn, messages]);

    return {
        messages,
        isProcessing,
        isLoggedIn,
        user,
        sendMessage
    };
};
