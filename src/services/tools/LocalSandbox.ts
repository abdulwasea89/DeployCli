import { Sandbox, CommandResult } from "bash-tool";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * A persistent Sandbox implementation that operates on the actual local filesystem.
 */
export class LocalSandbox implements Sandbox {
  async executeCommand(command: string): Promise<CommandResult> {
    try {
      const stdout = execSync(command, { encoding: "utf8", cwd: process.cwd(), stdio: ['pipe', 'pipe', 'pipe'] });
      return { stdout: stdout || "", stderr: "", exitCode: 0 };
    } catch (e: any) {
      return { 
        stdout: e.stdout?.toString() || "", 
        stderr: e.stderr?.toString() || e.message, 
        exitCode: e.status || 1 
      };
    }
  }

  async readFile(filePath: string): Promise<string> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(fullPath, "utf8");
  }

  async writeFiles(files: Array<{ path: string; content: string | Buffer }>): Promise<void> {
    for (const file of files) {
      const fullPath = path.isAbsolute(file.path) ? file.path : path.join(process.cwd(), file.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, file.content);
    }
  }
}
