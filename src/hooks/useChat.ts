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
import { metrics } from '../services/metrics.ts';
import { fileHistoryService } from '../services/FileHistoryService.ts';
import { toolRegistry } from '../services/tools/ToolRegistry.ts';

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
                { role: 'assistant', content: `📚 **Available Commands**

**Session**
/login - Sign in to your account
/logout - Sign out
/clear - Clear chat history
/exit - Exit application

**Files**
/view <file> - View file with line numbers
/ls [path] - List directory contents
/search <pattern> - Search in files

**Git**
/status - Show git status
/diff [file] - Show git diff

**Tools**
/init - Generate AGENTS.md for project
/metrics - Show session stats
/history - View past sessions
/session <id> - Load session
/model [name] - View/switch model` }
            ]);
            return;
        }

        if (command === '/metrics') {
            const summary = metrics.getSummary();
            setMessages(prev => [
                ...prev,
                { role: 'user', content: value },
                { role: 'assistant', content: summary }
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

        if (command === '/undo') {
            const restoredPath = fileHistoryService.undo();
            setMessages(prev => [
                ...prev,
                { role: 'user', content: value },
                { role: 'assistant', content: restoredPath 
                    ? `↩️ Successfully undid changes to: \`${restoredPath}\``
                    : `⚠️ No more changes to undo.` }
            ]);
            return;
        }

        if (command === '/redo') {
            const restoredPath = fileHistoryService.redo();
            setMessages(prev => [
                ...prev,
                { role: 'user', content: value },
                { role: 'assistant', content: restoredPath 
                    ? `↪️ Successfully redid changes to: \`${restoredPath}\``
                    : `⚠️ No more changes to redo.` }
            ]);
            return;
        }

        if (command.startsWith('/model ')) {
            const newModel = command.split(' ')[1];
            setSelectedModel(newModel);
            setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `Switched to model: ${newModel}` }]);
            return;
        }

        // /view <file> - View file with line numbers
        if (command.startsWith('/view ')) {
            const filePath = command.slice(6).trim();
            try {
                const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
                if (!fs.existsSync(fullPath)) {
                    setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `❌ File not found: ${filePath}` }]);
                    return;
                }
                const content = fs.readFileSync(fullPath, 'utf-8');
                const lines = content.split('\n');
                const numbered = lines.map((line, i) => `${String(i + 1).padStart(4, ' ')} │ ${line}`).join('\n');
                const preview = numbered.length > 3000 ? numbered.slice(0, 3000) + '\n... (truncated)' : numbered;
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `📄 **${filePath}** (${lines.length} lines)\n\`\`\`\n${preview}\n\`\`\`` }]);
            } catch (e: any) {
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `❌ Error: ${e.message}` }]);
            }
            return;
        }

        // /ls [path] - List directory
        if (command === '/ls' || command.startsWith('/ls ')) {
            const dirPath = command.length > 3 ? command.slice(4).trim() : '.';
            try {
                const { execSync } = await import('child_process');
                const output = execSync(`ls -la "${dirPath}"`, { encoding: 'utf-8', cwd: process.cwd() });
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `📁 **${dirPath}**\n\`\`\`\n${output}\`\`\`` }]);
            } catch (e: any) {
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `❌ Error: ${e.message}` }]);
            }
            return;
        }

        // /search <pattern> - Search files with grep
        if (command.startsWith('/search ')) {
            const pattern = command.slice(8).trim();
            if (!pattern) {
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: 'Usage: /search <pattern>' }]);
                return;
            }
            try {
                const { execSync } = await import('child_process');
                const output = execSync(`grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.md" "${pattern}" . 2>/dev/null | head -50`, { 
                    encoding: 'utf-8', 
                    cwd: process.cwd(),
                    maxBuffer: 10 * 1024 * 1024
                });
                const result = output.trim() || 'No matches found.';
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `🔍 Search: "${pattern}"\n\`\`\`\n${result}\n\`\`\`` }]);
            } catch (e: any) {
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `No matches found for "${pattern}"` }]);
            }
            return;
        }

        // /status - Git status
        if (command === '/status') {
            try {
                const { execSync } = await import('child_process');
                const status = execSync('git status --short', { encoding: 'utf-8', cwd: process.cwd() });
                const branch = execSync('git branch --show-current', { encoding: 'utf-8', cwd: process.cwd() }).trim();
                const result = status.trim() || 'Working tree clean';
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `📊 Git Status (${branch})\n\`\`\`\n${result}\n\`\`\`` }]);
            } catch (e: any) {
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `❌ Not a git repository or git not available.` }]);
            }
            return;
        }

        // /init - Generate AGENTS.md
        if (command === '/init') {
            setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: '🔄 Scanning project structure to generate AGENTS.md...' }]);
            try {
                const { execSync } = await import('child_process');
                const files = execSync('find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" | head -30', { encoding: 'utf-8', cwd: process.cwd() });
                const pkgPath = path.join(process.cwd(), 'package.json');
                let projectName = 'Project';
                if (fs.existsSync(pkgPath)) {
                    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                    projectName = pkg.name || 'Project';
                }
                const agentsContent = `# ${projectName}\n\nThis project uses Deploy CLI for AI-assisted development.\n\n## Project Structure\n\n\`\`\`\n${files}\`\`\`\n\n## Code Standards\n\n- Use TypeScript with strict mode\n- Follow existing code patterns\n- Test changes before committing\n\n## Commands\n\n- \`npm run dev\` - Start development\n- \`npm test\` - Run tests\n`;
                fs.writeFileSync(path.join(process.cwd(), 'AGENTS.md'), agentsContent, 'utf-8');
                setMessages(prev => [...prev, { role: 'assistant', content: '✅ Created AGENTS.md with project context.' }]);
            } catch (e: any) {
                setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${e.message}` }]);
            }
            return;
        }

        // /diff [file] - Show git diff
        if (command === '/diff' || command.startsWith('/diff ')) {
            const filePath = command.length > 5 ? command.slice(6).trim() : '';
            try {
                const { execSync } = await import('child_process');
                const diffCmd = filePath ? `git diff "${filePath}"` : 'git diff --stat';
                const output = execSync(diffCmd, { encoding: 'utf-8', cwd: process.cwd() });
                const result = output.trim() || 'No changes';
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `📝 Diff${filePath ? `: ${filePath}` : ''}\n\`\`\`diff\n${result}\n\`\`\`` }]);
            } catch (e: any) {
                setMessages(prev => [...prev, { role: 'user', content: value }, { role: 'assistant', content: `❌ Error: ${e.message}` }]);
            }
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
            let localHistory: Message[] = [...messages, userMsg];

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
                localHistory = [
                    { role: 'system', content: `The user has provided the following file context in TOON format:\n\n${fileToon}` },
                    ...messages,
                    userMsg
                ];
            }

            let iterations = 0;
            const MAX_ITERATIONS = 10;
            let shouldContinue = true;

            while (shouldContinue && iterations < MAX_ITERATIONS) {
                iterations++;
                let currentAssistantMsg: Message = { role: 'assistant', content: '', reasoning: '', toolCalls: [] };
                
                const { fullStream } = await getAIStream(localHistory, selectedModel);
                let hadToolCalls = false;

                for await (const part of fullStream) {
                    switch (part.type) {
                        case 'reasoning-delta':
                            currentAssistantMsg.reasoning = (currentAssistantMsg.reasoning || '') + part.text;
                            setMessages([...localHistory, currentAssistantMsg]);
                            break;
                        case 'text-delta':
                            currentAssistantMsg.content = (currentAssistantMsg.content || '') + part.text;
                            setMessages([...localHistory, currentAssistantMsg]);
                            break;
                        case 'tool-call':
                            const toolPart = part as any;
                            const toolArgs = toolPart.args || toolPart.input;
                            currentAssistantMsg.toolCalls = [...(currentAssistantMsg.toolCalls || []), {
                                toolCallId: toolPart.toolCallId,
                                toolName: toolPart.toolName,
                                args: toolArgs
                            }];
                            hadToolCalls = true;
                            setMessages([...localHistory, currentAssistantMsg]);
                            break;
                    }
                }

                // Finalize assistant message in localHistory
                localHistory.push(currentAssistantMsg);

                if (hadToolCalls && currentAssistantMsg.toolCalls) {
                    const toolResults: any[] = [];
                    
                    // Add "Executing tools..." status
                    setMessages([...localHistory, { role: 'assistant', content: '⚙️ Executing tools...' }]);
                    
                    for (const tc of currentAssistantMsg.toolCalls) {
                        const tool = toolRegistry.getTool(tc.toolName);
                        if (tool) {
                            try {
                                const result = await (tool as any).execute(tc.args, { toolCallId: tc.toolCallId });
                                toolResults.push({
                                    toolCallId: tc.toolCallId,
                                    toolName: tc.toolName,
                                    result: result
                                });
                            } catch (e: any) {
                                toolResults.push({
                                    toolCallId: tc.toolCallId,
                                    toolName: tc.toolName,
                                    result: `ERROR: ${e.message}`
                                });
                            }
                        } else {
                            toolResults.push({
                                toolCallId: tc.toolCallId,
                                toolName: tc.toolName,
                                result: `ERROR: Tool '${tc.toolName}' not found.`
                            });
                        }
                    }

                    const toolResultMsg: Message = { role: 'tool', toolResults };
                    localHistory.push(toolResultMsg);
                    setMessages([...localHistory]);
                    
                    // Continue to next iteration so AI can see results
                    shouldContinue = true;
                } else {
                    // No tool calls, we are done
                    shouldContinue = false;
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
