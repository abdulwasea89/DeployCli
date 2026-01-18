import React, { useState, useEffect } from 'react';
import { Message } from '../types/chat.ts';
import { getAIStream } from '../services/aiService.ts';
import fs from 'fs';
import path from 'path';
import open from 'open';
import { authManager } from '../services/auth/AuthManager.ts';
import { historyService } from '../services/history/HistoryService.ts';
import { APP_CONFIG } from '../../config/constants.ts';
import { v4 as uuidv4 } from 'uuid';
import { ToonService } from '../utils/ToonService.ts';

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState('');
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState(APP_CONFIG.DEFAULT_MODEL);
    const [currentSessionId, setCurrentSessionId] = useState<string>(uuidv4());

    useEffect(() => {
        const checkSession = async () => {
            const savedSession = await authManager.checkAuth();
            if (!savedSession) return;

            setIsLoggedIn(true);
            setUser(savedSession.userName || savedSession.userEmail);
            setSessionToken(savedSession.sessionToken);
            setMessages([
                {
                    role: 'assistant',
                    content: `🎉 Welcome back, ${savedSession.userName || savedSession.userEmail}!\n\nYou are already authenticated from a previous session.\nReasoning model (GPT-OSS) is ready to use.\n\nType your message or use /help for available commands.`
                }
            ]);
        };

        checkSession();

        // Background health check every 10 minutes
        const healthCheckInternal = setInterval(async () => {
            const valid = await authManager.checkAuth();
            if (!valid && isLoggedIn) {
                setIsLoggedIn(false);
                setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Your session has expired. Please type /login to reconnect.' }]);
            }
        }, 10 * 60 * 1000);

        return () => clearInterval(healthCheckInternal);
    }, []);

    const handleLogin = () => {
        setIsLoggedIn(true);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Successfully authenticated. Reasoning model (GPT-OSS) is now active.' }]);
    };

    const sendMessage = React.useCallback(async (value: string) => {
        if (!value.trim() || isProcessing) return;

        const command = value.trim();

        if (command === '/login') {
            // Prevent login if already logged in
            if (isLoggedIn) {
                setMessages(prev => [...prev,
                { role: 'user', content: '/login' },
                { role: 'assistant', content: `You are already logged in as ${user}! If you want to login as a different user, please type /logout first.` }
                ]);
                return;
            }

            setMessages(prev => [...prev, { role: 'user', content: '/login' }, { role: 'assistant', content: 'Initiating authentication... Please check your browser.' }]);

            try {
                const { code, url } = await authManager.initiateLogin();

                // Try to open browser but also show the link
                try {
                    await open(url);
                    setMessages(prev => [...prev, { role: 'assistant', content: `Opening browser... If it doesn't open, click here: ${url}\n\nWaiting for authentication (Code: ${code})...` }]);
                } catch (e) {
                    setMessages(prev => [...prev, { role: 'assistant', content: `Please open this link in your browser: ${url}\n\nWaiting for authentication (Code: ${code})...` }]);
                }

                const pollInterval = setInterval(async () => {
                    const session = await authManager.login(code);
                    if (session) {
                        clearInterval(pollInterval);
                        setIsLoggedIn(true);
                        setUser(session.userName || session.userEmail);
                        setSessionToken(session.sessionToken);
                        setMessages(prev => [...prev, { role: 'assistant', content: 'Successfully authenticated! Reasoning model (GPT-OSS) is now active.' }]);
                    }
                }, 3000);
            } catch (error: any) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Authentication failed: ${error.message}` }]);
            }
            return;
        }

        if (command === '/clear' || command === '/reset') {
            setMessages([]);
            return;
        }

        if (command === '/logout') {
            await authManager.logout();
            setIsLoggedIn(false);
            setUser('');
            setSessionToken(null);
            setMessages([{ role: 'assistant', content: 'You have been logged out. Type /login to authenticate again.' }]);
            return;
        }

        if (command === '/exit') {
            process.exit(0);
        }

        if (command === '/help') {
            setMessages(prev => [
                ...prev,
                { role: 'user', content: value },
                { role: 'assistant', content: 'Available commands:\n/login - Sign in\n/clear - Clear chat\n/exit - Exit app\n/help - Show this message\n/history - View sessions\n/session <id> - Load session\n/model [name] - View/Switch model' }
            ]);
            return;
        }

        if (command === '/history') {
            const sessions = await historyService.listSessions();
            if (sessions.length === 0) {
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: 'No saved sessions found.' }]);
                return;
            }

            const historyText = sessions.map(s => `ID: ${s.id.slice(0, 8)} | ${s.name} (${new Date(s.date).toLocaleDateString()})`).join('\n');
            setMessages(prev => [...prev,
            { role: 'user', content: value },
            { role: 'assistant', content: `Saved Sessions:\n${historyText}\n\nType /session <id> to load.` }
            ]);
            return;
        }

        if (command.startsWith('/session ')) {
            const sessionIdPart = command.split(' ')[1];
            const sessions = await historyService.listSessions();
            const sessionMeta = sessions.find(s => s.id.startsWith(sessionIdPart));

            if (!sessionMeta) {
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `Session '${sessionIdPart}' not found.` }]);
                return;
            }

            const fullSession = await historyService.loadSession(sessionMeta.id);
            if (fullSession) {
                setMessages(fullSession.messages);
                setCurrentSessionId(fullSession.id);
                setMessages(prev => [...prev, { role: 'assistant', content: `Loaded session: ${fullSession.name}` }]);
            }
            return;
        }

        if (command === '/model') {
            setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `Current model: ${selectedModel}\n\nTo switch, type /model <name>` }]);
            return;
        }

        if (command.startsWith('/model ')) {
            const newModel = command.split(' ')[1];
            setSelectedModel(newModel);
            setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `Switched to model: ${newModel}` }]);
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
                const filesData = fileTokens.map(token => {
                    const fileName = token.slice(1);
                    const fullPath = path.join(process.cwd(), fileName);
                    try {
                        const stats = fs.statSync(fullPath);
                        const isLarge = stats.size > 50 * 1024; // 50KB threshold

                        if (isLarge) {
                            return { 
                                name: fileName, 
                                size: stats.size, 
                                large: true,
                                instruction: 'This file is large. Use tools to peek at its content.' 
                            };
                        }

                        const content = fs.readFileSync(fullPath, 'utf-8');
                        return { name: fileName, content };
                    } catch (e) {
                        return { name: fileName, error: 'Could not read file' };
                    }
                });

                const fileToon = ToonService.toToon({ files: filesData });

                contextualMessages = [
                    { role: 'system', content: `The user has provided the following file context in TOON format:\n\n${fileToon}` },
                    ...messages,
                    userMsg
                ];
            }

            const { fullStream } = await getAIStream(contextualMessages, selectedModel);

            // Add placeholder for the AI response
            setMessages(prev => [...prev, { role: 'assistant', content: '', reasoning: '' }]);

            for await (const part of fullStream) {
                switch (part.type) {
                    case 'reasoning-delta':
                        setMessages(prev => {
                            const next = [...prev];
                            const last = next[next.length - 1];
                            if (last && last.role === 'assistant') {
                                last.reasoning = (last.reasoning || '') + part.text;
                            }
                            return next;
                        });
                        break;
                    case 'text-delta':
                        setMessages(prev => {
                            const next = [...prev];
                            const last = next[next.length - 1];
                            if (last && last.role === 'assistant') {
                                last.content = (last.content || '') + part.text;
                            }
                            return next;
                        });
                        break;
                    case 'tool-call':
                        setMessages(prev => {
                            const next = [...prev];
                            const last = next[next.length - 1];
                            if (last && last.role === 'assistant') {
                                const toolPart = part as any;
                                const toolArgs = toolPart.args || toolPart.input;
                                const toolInfo = `\n\n[🛠️ Tool Call: ${toolPart.toolName}]\n> Arguments: ${JSON.stringify(toolArgs)}\n`;
                                last.content = (last.content || '') + toolInfo;
                            }
                            return next;
                        });
                        break;
                    case 'tool-result':
                        setMessages(prev => {
                            const next = [...prev];
                            const last = next[next.length - 1];
                            if (last && last.role === 'assistant') {
                                const toolPart = part as any;
                                // Try multiple possible property names for the result
                                const rawResult = toolPart.result ?? toolPart.output ?? toolPart.content ?? toolPart.data;
                                const result = typeof rawResult === 'string' 
                                    ? (rawResult.length > 500 ? rawResult.slice(0, 497) + '...' : rawResult)
                                    : JSON.stringify(rawResult, null, 2);
                                const resultInfo = `\n[✅ Tool Result: ${toolPart.toolName}]\n\`\`\`\n${result}\n\`\`\`\n`;
                                last.content = (last.content || '') + resultInfo;
                            }
                            return next;
                        });
                        break;
                }
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, isLoggedIn, messages, selectedModel]);

    // Auto-save session
    useEffect(() => {
        if (messages.length > 0) {
            const firstMsg = messages.find(m => m.role === 'user')?.content || 'New Chat';
            const name = firstMsg.slice(0, 30) + (firstMsg.length > 30 ? '...' : '');

            historyService.saveSession({
                id: currentSessionId,
                name: name,
                date: new Date().toISOString(),
                messages: messages
            });
        }
    }, [messages, currentSessionId]);

    return {
        messages,
        isProcessing,
        isLoggedIn,
        user,
        sendMessage
    };
};
