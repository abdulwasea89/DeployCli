import { createBashTool, Sandbox, CommandResult } from "bash-tool";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Custom Sandbox implementation that interacts with the REAL local filesystem.
 */
class LocalSandbox implements Sandbox {
  async executeCommand(command: string): Promise<CommandResult> {
    try {
      const stdout = execSync(command, { encoding: "utf8", cwd: process.cwd() });
      return { stdout: stdout.trim(), stderr: "", exitCode: 0 };
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

async function testBashTool() {
  console.log("🚀 Initializing bash-tool (REAL LOCAL DISK)...");
  
  const localSandbox = new LocalSandbox();
  const { tools } = await createBashTool({
    sandbox: localSandbox,
    destination: "tests" // Base directory for the tools
  });

  const { bash, readFile, writeFile } = tools;
  const context = { toolCallId: "test", messages: [] } as any;

  try {
    console.log("\n--- Testing writeFile (Real Disk) ---");
    const testFilePath = "real-test.log";
    const writeResult = await (writeFile as any).execute({
      path: testFilePath,
      content: "Log entry: Writing to REAL disk with bash-tool.\nTimestamp: " + new Date().toISOString()
    }, context);
    console.log("Write Result:", writeResult);

    console.log("\n--- Testing readFile (Real Disk) ---");
    const readResult = await (readFile as any).execute({
      path: testFilePath
    }, context);
    console.log("Read Result Content:\n", readResult.content);

    console.log("\n--- Testing bash command (ls -l on real disk) ---");
    const bashLs: any = await (bash as any).execute({
      command: `ls -l tests/${testFilePath}`
    }, context);
    console.log("Bash Output:\n", bashLs.stdout);

    console.log("\n✅ bash-tool check completed successfully on real disk!");
    console.log(`📁 Check your file at: ${path.join(process.cwd(), "tests", testFilePath)}`);
  } catch (error) {
    console.error("\n❌ Error during bash-tool test:", error);
    process.exit(1);
  }
}

testBashTool();
