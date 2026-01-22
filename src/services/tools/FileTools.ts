import * as fs from 'fs';
import * as nodePath from 'path';
import { z } from 'zod';
import { tool } from 'ai';
import { toolRegistry } from './ToolRegistry.ts';
import { execSync } from 'child_process';
import { fileHistoryService } from '../FileHistoryService.ts';
import { auditLogger } from '../AuditLogger.ts';
import { createBashTool } from 'bash-tool';
import { LocalSandbox } from './LocalSandbox.ts';

// Initialize bash-tool with real disk access
const localSandbox = new LocalSandbox();
const bashToolkit = await createBashTool({
    sandbox: localSandbox,
    destination: process.cwd(),
});

// Internal helper for logging
const logToolCall = (name: string, args: any) => {
    fs.appendFileSync('opencode.log', `[${new Date().toISOString()}] TOOL_${name}: ${JSON.stringify(args)}\n`);
};

// Helper to get full path relative to cwd
const resolvePath = (filePath: string): string => {
    if (nodePath.isAbsolute(filePath)) {
        return filePath;
    }
    return nodePath.join(process.cwd(), filePath);
};

const SECRETS_PATTERNS = [
    /AI_KEY/i, /API_KEY/i, /SECRET/i, /PASSWORD/i, /TOKEN/i, /PRIVATE_KEY/i, /AUTH_DOMAIN/i
];

/**
 * Execute a bash command
 */
export const bash = tool({
    description: 'Execute a bash command in the project root. Be extremely careful with destructive commands.',
    inputSchema: z.object({
        command: z.string().describe('The bash command to execute')
    }),
    execute: async ({ command }, context) => {
        logToolCall('bash', { command });
        auditLogger.log('TOOL_BASH', undefined, { command });
        
        // Security check: simple blacklist
        const forbidden = ['rm -rf /', 'mkfs', 'dd if=', 'shutdown', 'reboot'];
        if (forbidden.some(f => command.includes(f))) {
            return 'ERROR: Command blocked for security reasons.';
        }

        try {
            const result: any = await (bashToolkit.tools.bash as any).execute({ command }, context);
            return result.stdout || result.stderr || 'Command executed successfully (no output).';
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Read the contents of a file from the filesystem.
 */
export const readFile = tool({
    description: 'Read the contents of a file from the filesystem.',
    inputSchema: z.object({
        path: z.string().describe('Path to the file to read'),
    }),
    execute: async ({ path: targetPath }, context) => {
        logToolCall('readFile', { path: targetPath });
        try {
            const result: any = await (bashToolkit.tools.readFile as any).execute({ path: targetPath }, context);
            if (!result.content && result.error) {
                return `ERROR: ${result.error}. Tip: If you are unsure of the path, use 'list' to check the directory or 'find' to search for the file.`;
            }
            return result.content;
        } catch (error: any) {
            return `ERROR: ${error.message}. Tip: If you are unsure of the path, use 'list' to check the directory or 'find' to search for the file.`;
        }
    }
});

// Compatibility Alias
export const read = readFile;

/**
 * Write content to a file on the actual filesystem
 */
export const writeFile = tool({
    description: 'Write content to a file. Creates the file if it does not exist, creates parent directories as needed.',
    inputSchema: z.object({
        path: z.string().describe('Path where the file should be written'),
        content: z.string().describe('Content to write to the file')
    }),
    execute: async ({ path, content }, context) => {
        logToolCall('writeFile', { path, contentLength: content?.length });
        
        // Security: Warn about potential secrets
        for (const pattern of SECRETS_PATTERNS) {
            if (pattern.test(content)) {
                logToolCall('writeFile_SECRET_WARNING', { path, pattern: pattern.toString() });
                break; // Only log once
            }
        }
        
        try {
            // Snapshot for undo/redo
            const fullPath = resolvePath(path);
            if (fs.existsSync(fullPath)) {
                const oldContent = fs.readFileSync(fullPath, 'utf-8');
                fileHistoryService.push(fullPath, oldContent);
            }

            const result: any = await (bashToolkit.tools.writeFile as any).execute({ path, content }, context);
            if (result.success) {
                auditLogger.log('TOOL_WRITEFILE', undefined, { path });
                return `SUCCESS: File written to ${path}`;
            }
            return `ERROR: Failed to write to ${path}. Ensure the path is correct and you have permissions.`;
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * List directory contents with structured metadata
 */
export const list = tool({
    description: 'List directory contents with file details. Use this when you are unsure of file names or paths.',
    inputSchema: z.object({
        path: z.string().optional().describe('Path to the directory (defaults to current directory)')
    }),
    execute: async ({ path }) => {
        logToolCall('list', { path });
        const targetPath = (path && path.trim()) || '.';
        try {
            const fullPath = resolvePath(targetPath);
            if (!fs.existsSync(fullPath)) {
                return `ERROR: Directory not found: ${targetPath}. Try listing the parent directory instead.`;
            }
            const items = fs.readdirSync(fullPath);
            
            const files = items.map(name => {
                const itemPath = nodePath.join(fullPath, name);
                const stats = fs.statSync(itemPath);
                return {
                    name,
                    path: nodePath.join(targetPath, name),
                    type: stats.isDirectory() ? 'directory' : 'file',
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    permissions: stats.mode.toString(8).slice(-3)
                };
            });
            
            return JSON.stringify(files);
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Intelligent file search combining find and grep
 */
export const search = tool({
    description: 'Perform an efficient search for files and content. Use this to discover where things are.',
    inputSchema: z.object({
        query: z.string().describe('Search term or pattern'),
        type: z.enum(['file', 'content', 'both']).default('both').describe('Whether to search for filenames, content, or both')
    }),
    execute: async ({ query, type }) => {
        logToolCall('search', { query, type });
        let results: string[] = [];
        
        if (type === 'file' || type === 'both') {
            try {
                const findOut = execSync(`find . -name "*${query}*" -type f -not -path "*/node_modules/*" 2>/dev/null | head -10`, {
                    encoding: 'utf-8',
                    timeout: 30000
                });
                if (findOut.trim()) results.push(`Found in filenames:\n${findOut.trim()}`);
            } catch (e: any) {
                if (e.message?.includes('ETIMEDOUT')) {
                    results.push(`File search timed out for "${query}". Try a more specific term.`);
                }
            }
        }

        if (type === 'content' || type === 'both') {
            try {
                const grepOut = execSync(`grep -rn --exclude-dir=.git --exclude-dir=node_modules "${query}" . 2>/dev/null | head -10`, {
                    encoding: 'utf-8',
                    maxBuffer: 10 * 1024 * 1024,
                    timeout: 30000
                });
                if (grepOut.trim()) results.push(`Found in content:\n${grepOut.trim()}`);
            } catch (e: any) {
                if (e.message?.includes('ETIMEDOUT')) {
                    results.push(`Content search timed out for "${query}". Try a more specific term.`);
                }
            }
        }

        return results.join('\n\n') || `No matches found for "${query}".`;
    }
});

/**
 * Find files by name
 */
export const find = tool({
    description: 'Find files by name pattern. Uses the find command.',
    inputSchema: z.object({
        name: z.string().describe('File name pattern to search for (e.g., "*.ts", "README.md")'),
        path: z.string().optional().describe('Directory to search in (defaults to current directory)')
    }),
    execute: async ({ name, path: searchPath }) => {
        logToolCall('find', { name, path: searchPath });
        const basePath = searchPath ? resolvePath(searchPath) : process.cwd();
        try {
            const output = execSync(`find "${basePath}" -name "${name}" -type f -not -path "*/node_modules/*" 2>/dev/null | head -50`, {
                encoding: 'utf-8',
                cwd: process.cwd(),
                timeout: 30000,
                maxBuffer: 5 * 1024 * 1024
            });
            return output.trim() || `No files matching "${name}" found.`;
        } catch (error: any) {
            if (error.message?.includes('ETIMEDOUT')) {
                return `ERROR: Search timed out. Try a more specific pattern or reduce search scope.`;
            }
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Edit a file by replacing a block of text
 */
export const edit = tool({
    description: 'Edit a file by replacing a specific block of text with new content.',
    inputSchema: z.object({
        path: z.string().describe('Path to the file to edit'),
        oldText: z.string().describe('The text block to replace. Must match exactly including whitespace.'),
        newText: z.string().describe('The new text to insert')
    }),
    execute: async ({ path, oldText, newText }) => {
        logToolCall('edit', { path, oldTextLength: oldText.length, newTextLength: newText.length });
        try {
            const fullPath = resolvePath(path);
            if (!fs.existsSync(fullPath)) return `ERROR: File not found: ${path}`;
            
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (!content.includes(oldText)) {
                return `ERROR: Could not find exact match for text block in ${path}. Ensure whitespace and indentation match exactly.`;
            }

            // Snapshot for undo/redo
            fileHistoryService.push(fullPath, content);

            const newContent = content.replace(oldText, newText);
            fs.writeFileSync(fullPath, newContent, 'utf-8');
            auditLogger.log('TOOL_EDIT', undefined, { path });
            return `SUCCESS: File ${path} updated.`;
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Register a new developer skill
 */
export const skill = tool({
    description: 'Register a reusable automation skill for the project.',
    inputSchema: z.object({
        name: z.string().describe('Name of the skill (e.g., deploy, test-all)'),
        description: z.string().describe('What the skill does'),
        command: z.string().describe('The shell command to run')
    }),
    execute: async ({ name, description, command }) => {
        logToolCall('skill', { name, description, command });
        try {
            const skillPath = nodePath.join(process.cwd(), '.agent', 'skills.json');
            let skills = {};
            if (fs.existsSync(skillPath)) {
                skills = JSON.parse(fs.readFileSync(skillPath, 'utf-8'));
            }
            (skills as any)[name] = { description, command };
            fs.mkdirSync(nodePath.dirname(skillPath), { recursive: true });
            fs.writeFileSync(skillPath, JSON.stringify(skills, null, 2), 'utf-8');
            return `SUCCESS: Skill "${name}" registered.`;
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Add a task to TODO.md
 */
export const todowrite = tool({
    description: 'Add a task to the TODO.md file.',
    inputSchema: z.object({
        task: z.string().describe('Task description to add')
    }),
    execute: async ({ task }) => {
        logToolCall('todowrite', { task });
        if (!task) return 'ERROR: No task provided.';
        try {
            const todoPath = nodePath.join(process.cwd(), 'TODO.md');
            const entry = `\n- [ ] ${task} (Created: ${new Date().toISOString()})`;
            fs.appendFileSync(todoPath, entry, 'utf-8');
            return `SUCCESS: Task added to TODO.md`;
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Read todo lists
 */
export const todoread = tool({
    description: 'Read the current TODO.md file to track task progress.',
    inputSchema: z.object({}),
    execute: async () => {
        logToolCall('todoread', {});
        const todoPath = nodePath.join(process.cwd(), 'TODO.md');
        try {
            if (fs.existsSync(todoPath)) {
                return fs.readFileSync(todoPath, 'utf-8');
            }
            return 'TODO.md not found. Use todowrite to create it.';
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Request user clarification
 */
export const question = tool({
    description: 'Ask the user for clarification or missing information.',
    inputSchema: z.object({
        text: z.string().describe('The question to ask the user')
    }),
    execute: async ({ text }) => {
        logToolCall('question', { text });
        return `QUESTION: ${text}`;
    }
});

/**
 * Find files matching a glob pattern
 */
export const glob = tool({
    description: 'Find files matching a glob pattern. Returns file paths sorted by modification time.',
    inputSchema: z.object({
        pattern: z.string().describe('Glob pattern (e.g., **/*.ts, src/**/*.tsx)'),
        path: z.string().optional().describe('Directory to search in (defaults to current directory)')
    }),
    execute: async ({ pattern, path: searchPath }) => {
        logToolCall('glob', { pattern, path: searchPath });
        const basePath = searchPath ? resolvePath(searchPath) : process.cwd();
        try {
            // Use find with name pattern for glob-like behavior
            const findPattern = pattern.replace(/\*\*/g, '').replace(/\*/g, '*');
            const output = execSync(`find "${basePath}" -name "${findPattern}" -type f 2>/dev/null | head -50`, {
                encoding: 'utf-8',
                cwd: process.cwd(),
                timeout: 30000
            });
            return output.trim() || `No files matching "${pattern}" found.`;
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Apply a unified diff patch to files
 */
export const patch = tool({
    description: 'Apply a unified diff patch to files. Use this for multi-file changes.',
    inputSchema: z.object({
        patchContent: z.string().describe('Unified diff patch content')
    }),
    execute: async ({ patchContent }) => {
        logToolCall('patch', { patchLength: patchContent?.length });
        try {
            // Write patch to temp file and apply
            const tempPath = nodePath.join(process.cwd(), '.tmp-patch');
            fs.writeFileSync(tempPath, patchContent, 'utf-8');
            const output = execSync(`patch -p1 < "${tempPath}" 2>&1`, {
                encoding: 'utf-8',
                cwd: process.cwd(),
                timeout: 30000
            });
            // Clean up temp file
            try { fs.unlinkSync(tempPath); } catch {}
            return output || 'Patch applied successfully.';
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Fetch external documentation or content from a URL
 */
export const webfetch = tool({
    description: 'Fetch content from a URL (documentation, API specs, etc.).',
    inputSchema: z.object({
        url: z.string().describe('The URL to fetch content from')
    }),
    execute: async ({ url }) => {
        logToolCall('webfetch', { url });
        try {
            // Using curl via bash for production-grade simplicity and robustness
            const output = execSync(`curl -sL "${url}" | head -c 5000`, { encoding: 'utf-8', timeout: 30000 });
            return output || 'Success (No content returned).';
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Advanced code analysis tool (Definitions/References)
 */
export const codeAnalyze = tool({
    description: 'Analyze code to find definitions and references of a symbol.',
    inputSchema: z.object({
        symbol: z.string().describe('The symbol or function name to analyze'),
        mode: z.enum(['definitions', 'references', 'both']).default('both')
    }),
    execute: async ({ symbol, mode }) => {
        logToolCall('codeAnalyze', { symbol, mode });
        let results: string[] = [];

        try {
            if (mode === 'definitions' || mode === 'both') {
                const defPattern = `(export\\s+)?(const|let|var|function|class|interface|type)\\s+${symbol}\\s*[:=(]`;
                const defOut = execSync(`grep -rnE "${defPattern}" . --exclude-dir=.git --exclude-dir=node_modules 2>/dev/null | head -5`, {
                    encoding: 'utf-8',
                    timeout: 20000
                });
                if (defOut.trim()) results.push(`Definitions found:\n${defOut.trim()}`);
            }

            if (mode === 'references' || mode === 'both') {
                const refOut = execSync(`grep -rn "${symbol}" . --exclude-dir=.git --exclude-dir=node_modules | grep -vE "(export\\s+)?(const|let|var|function|class|interface|type)\\s+${symbol}" 2>/dev/null | head -10`, {
                    encoding: 'utf-8',
                    timeout: 20000
                });
                if (refOut.trim()) results.push(`References found:\n${refOut.trim()}`);
            }

            return results.join('\n\n') || `No definitions or references found for "${symbol}".`;
        } catch (e: any) {
            if (e.message?.includes('ETIMEDOUT')) {
                return `ERROR: Code analysis timed out for "${symbol}". Try a more specific search.`;
            }
            return `No matches found for "${symbol}".`;
        }
    }
});

// Register all tools to the global registry
toolRegistry.register('bash', bash);
toolRegistry.register('readFile', readFile);
toolRegistry.register('writeFile', writeFile);
toolRegistry.register('list', list);
toolRegistry.register('search', search);
toolRegistry.register('find', find);
toolRegistry.register('edit', edit);
toolRegistry.register('skill', skill);
toolRegistry.register('todowrite', todowrite);
toolRegistry.register('todoread', todoread);
toolRegistry.register('question', question);
toolRegistry.register('glob', glob);
toolRegistry.register('patch', patch);
toolRegistry.register('codeAnalyze', codeAnalyze);
toolRegistry.register('webfetch', webfetch);
