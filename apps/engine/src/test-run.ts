// WARNING: This file is for local testing only. Must never be deployed to production.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../.env');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  for (const line of envFile.split('\n')) {
    const [key, ...vals] = line.trim().split('=');
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
} catch {
  console.warn('[env] Could not load .env file');
}

import { runEngine } from './scheduler/cron.js';

async function main() {
  console.log(`[test-run] START: ${new Date().toISOString()}`);
  await runEngine(true);
  console.log(`[test-run] COMPLETE: ${new Date().toISOString()}`);
}

main();
