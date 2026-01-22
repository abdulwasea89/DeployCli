import "dotenv/config";
import fs from "fs/promises";

import path from "path";
import fg from "fast-glob";
import { ToolLoopAgent, tool } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";

/* ===============================
   PERMISSION SYSTEM
================================ */
import { execaCommand } from "execa";

const bashTool = tool({
  description: "Execute shell commands.",
  inputSchema: z.object({
    command: z.string(),
  }),
  execute: async ({ command }) => {
    requirePermission("bash");

    const result = await execaCommand(command, {
      cwd: process.cwd(),
      timeout: 60_000,
    });

    return result.stdout || result.stderr;
  },
});


type PermissionKey =
  | "read"
  | "write"
  | "edit"
  | "list"
  | "glob"
  | "grep"
  | "bash"
  | "question";

const permissions: Record<PermissionKey, boolean> = {
  read: true,
  write: true,
  edit: true,
  list: true,
  glob: true,
  grep: true,
  bash: true, // ⚠️ ENABLED FOR TESTING
  question: true,
};

function requirePermission(key: PermissionKey) {
  if (!permissions[key]) {
    throw new Error(`Permission denied for tool: ${key}`);
  }
}

/* ===============================
   UTILS
================================ */

const safePath = (p: string) =>
  path.resolve(process.cwd(), p);

/* ===============================
   TOOLS
================================ */

/* READ */
const readTool = tool({
  description: "Read a file. Supports optional line ranges.",
  inputSchema: z.object({
    path: z.string(),
    startLine: z.number().optional(),
    endLine: z.number().optional(),
  }),
  execute: async ({ path, startLine, endLine }) => {
    requirePermission("read");
    const content = await fs.readFile(safePath(path), "utf-8");
    if (startLine !== undefined || endLine !== undefined) {
      const lines = content.split("\n");
      return lines.slice(startLine ?? 0, endLine).join("\n");
    }
    return content;
  },
});

/* WRITE */
const writeTool = tool({
  description: "Create or overwrite a file.",
  inputSchema: z.object({
    path: z.string(),
    content: z.string(),
  }),
  execute: async ({ path, content }) => {
    requirePermission("write");
    await fs.writeFile(safePath(path), content, "utf-8");
    return "File written successfully.";
  },
});

/* EDIT (exact replace) */
const editTool = tool({
  description: "Edit a file by exact string replacement.",
  inputSchema: z.object({
    path: z.string(),
    find: z.string(),
    replace: z.string(),
  }),
  execute: async ({ path, find, replace }) => {
    requirePermission("edit");
    const filePath = safePath(path);
    const content = await fs.readFile(filePath, "utf-8");

    if (!content.includes(find)) {
      throw new Error("Exact match not found.");
    }

    const updated = content.replace(find, replace);
    await fs.writeFile(filePath, updated, "utf-8");
    return "Edit applied successfully.";
  },
});

/* LIST */
const listTool = tool({
  description: "List files and directories.",
  inputSchema: z.object({
    path: z.string().default("."),
  }),
  execute: async ({ path }) => {
    requirePermission("list");
    return await fs.readdir(safePath(path));
  },
});

/* GLOB */
const globTool = tool({
  description: "Find files using glob patterns.",
  inputSchema: z.object({
    pattern: z.string(),
  }),
  execute: async ({ pattern }) => {
    requirePermission("glob");
    return await fg(pattern, { cwd: process.cwd() });
  },
});

/* GREP */
const grepTool = tool({
  description: "Search file contents using regex.",
  inputSchema: z.object({
    pattern: z.string(),
    files: z.array(z.string()).optional(),
  }),
  execute: async ({ pattern, files }) => {
    requirePermission("grep");
    const regex = new RegExp(pattern, "g");
    const targets =
      files ?? (await fg("**/*.*", { cwd: process.cwd() }));

    const results: Record<string, string[]> = {};

    for (const file of targets) {
      try {
        const content = await fs.readFile(
          safePath(file),
          "utf-8"
        );
        const matches = content.match(regex);
        if (matches) results[file] = matches;
      } catch {}
    }

    return results;
  },
});


/* QUESTION */
const questionTool = tool({
  description: "Ask the user a question.",
  inputSchema: z.object({
    question: z.string(),
  }),
  execute: async ({ question }) => {
    requirePermission("question");
    return `USER_INPUT_REQUIRED: ${question}`;
  },
});

/* ===============================
   AGENT
================================ */

export const agent = new ToolLoopAgent({
  model: groq("moonshotai/kimi-k2-instruct-0905"),
  instructions: `
You are a CLI coding agent.

Rules:
- Use tools for ALL file and shell operations
- Never hallucinate file contents
- Ask questions if unsure
- Be precise and minimal

Most Important Rules:
- Check the file size before reading it. If a file is large, read it using line ranges to avoid exceeding context limits

`,
  tools: {
    read: readTool,
    write: writeTool,
    edit: editTool,
    list: listTool,
    glob: globTool,
    grep: grepTool,
    bash: bashTool,
    question: questionTool,
  },
});

/* ===============================
   OPTIONAL RUNNER
================================ */

async function run() {
  console.log("🚀 Starting AI Agent test (Streaming)...");
  try {
    const result = await agent.stream({
      prompt: `
Read the whole of package-lock.json and tell me the imp packages`,
    });

    console.log("\n✅ Agent Response:\n");

    for await (const part of result.fullStream) {
      if (part.type === "text-delta" && (part as any).text) {
        process.stdout.write((part as any).text);
      } else if (part.type === "tool-call") {
        console.log(`\n\n🔧 Tool Call: ${part.toolName}`);
        console.log(`Arguments:`, (part as any).args || (part as any).input);
      } else if (part.type === "tool-result") {
        console.log(`\n✅ Tool Result: ${part.toolName}`);
        console.log(`Result:`, (part as any).result || (part as any).output || part);
      }
    }
    console.log("\n\n✅ Stream complete.");
  } catch (error) {
    console.error("❌ Agent Error:", error);
  }
}

run().catch(console.error);