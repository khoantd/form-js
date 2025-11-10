#!/usr/bin/env node

const { execSync } = require('child_process');

// Skip 'node' and script path, handle '--' separator if present
const args = process.argv.slice(2);
const scope = args.find(arg => arg !== '--' && !arg.startsWith('--'));

if (scope) {
  execSync(`lerna run dev --stream --scope ${scope}`, { stdio: 'inherit' });
} else {
  execSync('lerna run dev --stream', { stdio: 'inherit' });
}

