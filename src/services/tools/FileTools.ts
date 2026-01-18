import { execSync } from 'child_process';
import fs from 'fs';
import * as nodePath from 'path';
import { z } from 'zod';
import { tool } from 'ai';

// Internal helper for logging
const logToolCall = (name: string, args: any) => {
    fs.appendFileSync('opencode.log', `[${new Date().toISOString()}] TOOL_${name}: ${JSON.stringify(args)}\n`);
};

// Helper to get full path relative to cwd
const resolvePath = (filePath: string): string => {
    if (nodePath.isAbsolute(filePath)) {
        return filePath;
    }
    return nodePath.resolve(process.cwd(), filePath);
};

/**
 * Execute bash commands directly on the system (not sandboxed)
 */
export const bash = tool({
    description: 'Execute bash commands on the system. Returns stdout, stderr, and exit code.',
    inputSchema: z.object({
        command: z.string().describe('The bash command to execute')
    }),
    execute: async ({ command }) => {
        logToolCall('bash', { command });
        try {
            const stdout = execSync(command, {
                encoding: 'utf-8',
                cwd: process.cwd(),
                timeout: 60000, // 60 second timeout
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });
            return stdout || '(Command completed with no output)';
        } catch (error: any) {
            // execSync throws on non-zero exit code, capture the output anyway
            const stdout = error.stdout?.toString() || '';
            const stderr = error.stderr?.toString() || '';
            if (error.status !== undefined) {
                return `${stdout}${stderr}\n(Exit code: ${error.status})`;
            }
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Read file contents from the actual filesystem
 */
export const readFile = tool({
    description: 'Read the contents of a file from the filesystem.',
    inputSchema: z.object({
        path: z.string().describe('Path to the file to read')
    }),
    execute: async ({ path }) => {
        logToolCall('readFile', { path });
        try {
            const fullPath = resolvePath(path);
            if (!fs.existsSync(fullPath)) {
                return `ERROR: File not found: ${path}`;
            }
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                return `ERROR: Path is a directory, not a file: ${path}`;
            }
            const content = fs.readFileSync(fullPath, 'utf-8');
            return content;
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Write content to a file on the actual filesystem
 */
export const writeFile = tool({
    description: 'Write content to a file. Creates the file if it does not exist, creates parent directories as needed.',
    inputSchema: z.object({
        path: z.string().describe('Path where the file should be written'),
        content: z.string().describe('Content to write to the file')
    }),
    execute: async ({ path, content }) => {
        logToolCall('writeFile', { path, contentLength: content?.length });
        try {
            const fullPath = resolvePath(path);
            // Create parent directories if they don't exist
            const dir = nodePath.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(fullPath, content, 'utf-8');
            return `SUCCESS: File written to ${path}`;
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

// Compatibility Alias
export const read = readFile;

/**
 * List directory contents with details
 */
export const list = tool({
    description: 'List directory contents with file details (permissions, size, date).',
    inputSchema: z.object({
        path: z.string().optional().describe('Path to the directory (defaults to current directory)')
    }),
    execute: async ({ path }) => {
        logToolCall('list', { path });
        const targetPath = (path && path.trim()) || '.';
        try {
            const fullPath = resolvePath(targetPath);
            const output = execSync(`ls -la "${fullPath}"`, { 
                encoding: 'utf-8',
                cwd: process.cwd(),
                timeout: 10000
            });
            return output || 'Directory is empty.';
        } catch (error: any) {
            if (error.message.includes('ENOENT') || error.message.includes('No such file')) {
                return `ERROR: Directory not found: ${targetPath}`;
            }
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Search for patterns in files using grep
 */
export const grep = tool({
    description: 'Search for a pattern in files. Returns matching lines with file names and line numbers.',
    inputSchema: z.object({
        pattern: z.string().describe('Pattern to search for'),
        include: z.string().optional().describe('File pattern to filter (e.g., "*.ts", "*.md")')
    }),
    execute: async ({ pattern, include }) => {
        logToolCall('grep', { pattern, include });
        try {
            const includeArg = include ? `--include="${include}"` : '';
            // Use || true to prevent throwing on no matches (exit code 1)
            const output = execSync(`grep -rn ${includeArg} "${pattern}" . 2>/dev/null || true`, {
                encoding: 'utf-8',
                cwd: process.cwd(),
                timeout: 30000,
                maxBuffer: 10 * 1024 * 1024
            });
            return output.trim() || 'No matches found.';
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
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
    execute: async ({ name, path }) => {
        logToolCall('find', { name, path });
        const searchPath = (path && path.trim()) || '.';
        try {
            const output = execSync(`find "${searchPath}" -name "${name}" 2>/dev/null || true`, {
                encoding: 'utf-8',
                cwd: process.cwd(),
                timeout: 30000
            });
            return output.trim() || `No files matching "${name}" found.`;
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Edit a file by replacing text
 */
export const edit = tool({
    description: 'Edit a file by replacing specific text. The old text must match exactly.',
    inputSchema: z.object({
        path: z.string().describe('Path to the file'),
        oldText: z.string().describe('Exact text to be replaced'),
        newText: z.string().describe('New text to replace it with')
    }),
    execute: async ({ path: targetPath, oldText, newText }) => {
        logToolCall('edit', { path: targetPath, oldTextLen: oldText?.length, newTextLen: newText?.length });
        if (!targetPath || !oldText) {
            return 'ERROR: Missing required arguments (path and oldText are required).';
        }
        try {
            const fullPath = resolvePath(targetPath);
            if (!fs.existsSync(fullPath)) {
                return `ERROR: File not found: ${targetPath}`;
            }
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (!content.includes(oldText)) {
                return 'ERROR: Text to replace not found in file. Ensure it matches exactly.';
            }
            const updated = content.replace(oldText, newText);
            fs.writeFileSync(fullPath, updated, 'utf-8');
            return `SUCCESS: Replaced text in ${targetPath}`;
        } catch (error: any) {
            return `ERROR: ${error.message}`;
        }
    }
});

/**
 * Load skill configuration
 */
export const skill = tool({
    description: 'Load behavior instructions from a SKILL.md file.',
    inputSchema: z.object({
        name: z.string().describe('Name of the skill to load')
    }),
    execute: async ({ name }) => {
        logToolCall('skill', { name });
        if (!name) return 'ERROR: Missing skill name.';
        const skillPath = nodePath.join(process.cwd(), '.opencode', 'skill', name, 'SKILL.md');
        try {
            if (fs.existsSync(skillPath)) {
                return fs.readFileSync(skillPath, 'utf-8');
            }
            return `ERROR: Skill "${name}" not found at ${skillPath}`;
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
 * Ask the user for clarification
 */
export const question = tool({
    description: 'Ask the user a clarifying question.',
    inputSchema: z.object({
        question: z.string().describe('The question to ask'),
        options: z.array(z.string()).optional().describe('Optional answer choices')
    }),
    execute: async ({ question, options }) => {
        logToolCall('question', { question, options });
        if (!question) return 'ERROR: No question provided.';
        return `WAITING FOR USER: ${question}${options ? `\nOptions: ${options.join(', ')}` : ''}`;
    }
});
