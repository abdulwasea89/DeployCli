#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entryPoint = path.join(__dirname, '../src/source.tsx');

const child = spawn('npx', ['tsx', entryPoint], {
    stdio: 'inherit',
    shell: true
});

child.on('exit', (code) => {
    process.exit(code || 0);
});
