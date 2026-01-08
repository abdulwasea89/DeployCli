import React, { useState, useEffect } from 'react';
import { Message } from '../types/chat.ts';
import { getAIStream } from '../services/aiService.ts';
import fs from 'fs';
import path from 'path';
import open from 'open';
import { sessionStorage } from '../services/session/sessionStorage.ts';

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState('');
    const [sessionToken, setSessionToken] = useState<string | null>(null);

    // Auto-login on mount if session exists
    useEffect(() => {
        const checkSession = async () => {
            const savedSession = sessionStorage.loadSession();
            if (!savedSession) return;

            try {
                const response = await fetch('http://localhost:3001/custom/auth/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionToken: savedSession.sessionToken })
                });

                const data = await response.json();
                if (data.valid) {
                    setIsLoggedIn(true);
                    setUser(data.user.name || data.user.email);
                    setSessionToken(savedSession.sessionToken);
                    setMessages([
                        {
                            role: 'assistant',
                            content: `🎉 Welcome back, ${data.user.name || data.user.email}!\n\nYou are already authenticated from a previous session.\nReasoning model (GPT-OSS) is ready to use.\n\nType your message or use /help for available commands.`
                        }
                    ]);
                } else {
                    // Session expired, clear it
                    sessionStorage.clearSession();
                }
            } catch (error) {
                console.error('Session validation failed:', error);
                sessionStorage.clearSession();
            }
        };

        checkSession();
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
                const response = await fetch("http://localhost:3001/custom/auth/initiate", { method: "POST" }

                );

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server returned ${response.status}: ${errorText.substring(0, 100)}`);
                }

                const { code, url } = await response.json();

                console.log(code, url)

                // Try to open browser but also show the link
                try {
                    await open(url);
                    setMessages(prev => [...prev, { role: 'assistant', content: `Opening browser... If it doesn't open, click here: ${url}\n\nWaiting for authentication (Code: ${code})...` }]);
                } catch (e) {
                    setMessages(prev => [...prev, { role: 'assistant', content: `Please open this link in your browser: ${url}\n\nWaiting for authentication (Code: ${code})...` }]);
                }

                const pollInterval = setInterval(async () => {
                    try {
                        const pollResp = await fetch(`http://localhost:3001/custom/auth/poll?code=${code}`);
                        const pollData = await pollResp.json();

                        if (pollData.authenticated) {
                            clearInterval(pollInterval);

                            // Fetch user details and session token
                            const userResp = await fetch(`http://localhost:3001/api/auth/get-session`, {
                                headers: { 'Cookie': `better-auth.session_token=${pollData.sessionToken}` }
                            });
                            const userData = await userResp.json();

                            setIsLoggedIn(true);
                            setUser(userData.user?.name || userData.user?.email || pollData.userId);
                            setSessionToken(pollData.sessionToken || '');

                            // Save session to disk
                            if (pollData.sessionToken && userData.user) {
                                sessionStorage.saveSession(
                                    pollData.sessionToken,
                                    userData.user.id,
                                    userData.user.name || '',
                                    userData.user.email || ''
                                );
                            }

                            setMessages(prev => [...prev, { role: 'assistant', content: 'Successfully authenticated! Reasoning model (GPT-OSS) is now active.' }]);
                        }
                    } catch (err) {
                        // Silently fail polling errors
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
            sessionStorage.clearSession();
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
