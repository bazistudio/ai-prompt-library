const { spawn } = require('child_process');
const path = process.env.LOCALAPPDATA + "\\Programs\\AI Prompt Library\\AI Prompt Library.exe";

console.log('Spawning:', path);
const proc = spawn(path, [], {
  env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' }
});

proc.stdout.on('data', (data) => console.log('[STDOUT]', data.toString()));
proc.stderr.on('data', (data) => console.error('[STDERR]', data.toString()));

proc.on('close', (code) => console.log('Process exited with code', code));
