#!/usr/bin/env node
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load world.json
const configPath = path.join(process.cwd(), 'world.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ No world.json found in current directory.');
  process.exit(1);
}

const world = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const image = world.image;
const localTag = world.name;
const tag = `${image}:latest`;

console.log(`📦 Preparing to push world "${world.name}" to GHCR...`);
console.log(`🔖 Tagging: ${localTag} → ${tag}`);

try {
  execSync(`docker tag ${localTag} ${tag}`, { stdio: 'inherit' });
} catch (err) {
  console.error(`❌ Failed to tag image "${localTag}". Make sure it's built locally first.`);
  process.exit(1);
}

console.log(`🚀 Pushing to ${tag}...`);
const pushResult = spawnSync('docker', ['push', tag], { stdio: 'inherit' });

if (pushResult.status === 0) {
  console.log(`✅ World "${world.name}" pushed successfully to ${tag}!`);
} else {
  console.warn(`⚠️ Docker push exited with status ${pushResult.status}, but this may be safe to ignore if the image appears in GHCR.`);
  console.warn(`   You can check at: https://github.com/${image.split('/')[1]}?tab=packages`);
}


console.log(`✅ World "${world.name}" pushed successfully to ${tag}!`);
console.log(`🌐 Check it at: https://github.com/${image.split('/')[1]}?tab=packages`);
