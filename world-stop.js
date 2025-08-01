#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- Parse optional directory or name ---
const arg = process.argv[2] || '.';
const worldDir = path.resolve(arg);
const configPath = path.join(worldDir, 'world.json');

if (!fs.existsSync(configPath)) {
  console.error(`❌ No world.json found in: ${configPath}`);
  process.exit(1);
}

const world = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const imageName = world.image;

console.log(`🛑 Looking for running container using image: ${imageName}...`);

let output = '';

try {
  output = execSync(`docker ps --filter ancestor=${imageName} --format "{{.ID}} {{.Names}}"`).toString().trim();
} catch (err) {
  console.error(`❌ Failed to run docker ps`);
  process.exit(1);
}

if (!output) {
  console.log(`🚫 No running container found for image: ${imageName}`);
  process.exit(0);
}

// If multiple matches, stop them all
const containers = output.split('\n').map(line => line.split(' ')[0]);

containers.forEach(containerId => {
  try {
    console.log(`🛑 Stopping container ${containerId}...`);
    execSync(`docker stop ${containerId}`, { stdio: 'inherit' });
  } catch (err) {
    console.warn(`⚠️ Failed to stop container ${containerId}`);
  }
});

console.log(`✅ ${containers.length} container(s) stopped.`);
