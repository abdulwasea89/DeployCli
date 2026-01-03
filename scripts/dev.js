#!/usr/bin/env node
import { spawn } from 'child_process';

console.log('🚀 Starting Deploy CLI in Development Mode...');

const child = spawn('npx', ['tsx', 'src/source.tsx'], {
    stdio: 'inherit',
    shell: true
});

child.on('exit', (code) => {
    process.exit(code || 0);
});
