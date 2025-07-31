#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

// --- Parse CLI args ---
const args = process.argv.slice(2);
const inputDir = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-')) || '.';
const portOverride = getArg('--port') || null;
const detached = args.includes('--detach') || args.includes('-d');

// --- Helper: get --key=value ---
function getArg(flag) {
  const entry = args.find(arg => arg.startsWith(flag + '='));
  return entry ? entry.split('=')[1] : null;
}

// --- Load world.json ---
const worldDir = path.resolve(inputDir);
const configPath = path.join(worldDir, 'world.json');

if (!fs.existsSync(configPath)) {
  console.error(`❌ No world.json found in: ${configPath}`);
  process.exit(1);
}

const world = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const image = world.image;
const launchPort = parseInt(portOverride || world.port || 8080);

console.log(`🚀 Launching "${world.name}" from: ${worldDir}`);
console.log(`📦 Image: ${image}`);
console.log(`🗂️  Type: ${world.type}`);
console.log(`🛠️  Entry: ${world.entry}`);
if (portOverride) console.log(`⚙️  Port override: ${launchPort}`);
if (detached) console.log(`🧩 Running in detached mode`);
console.log('');

// --- Check if Docker image exists locally ---
try {
  execSync(`docker image inspect ${image}`, { stdio: 'ignore' });
} catch (err) {
  console.warn(`⚠️ Image "${image}" not found locally.`);
  const dockerfilePath = path.join(worldDir, 'Dockerfile');

  if (fs.existsSync(dockerfilePath)) {
    console.log(`🔧 Building Docker image locally...`);
    const buildResult = spawnSync('docker', ['build', '-t', image, worldDir], { stdio: 'inherit' });

    if (buildResult.status !== 0) {
      console.error('❌ Docker build failed. Aborting launch.');
      process.exit(1);
    }
  } else {
    console.error(`❌ Dockerfile not found at ${dockerfilePath}. Cannot build image.`);
    process.exit(1);
  }
}

// --- Launch container ---
const dockerArgs = ['run', '--rm'];

if (world.type === 'web') {
  dockerArgs.push('-p', `${launchPort}:80`);
} else if (world.type === 'cli') {
  dockerArgs.push('-it');
} else {
  console.error(`❌ Unknown world type: "${world.type}"`);
  process.exit(1);
}

if (detached) dockerArgs.push('-d');

dockerArgs.push(image);

console.log(`▶️ docker ${dockerArgs.join(' ')}`);
const result = spawnSync('docker', dockerArgs, { stdio: 'inherit' });

if (result.status !== 0 && !detached) {
  console.warn(`⚠️ Docker exited with code ${result.status}. The world may still have launched correctly.`);
} else {
  console.log(detached ? `✅ Detached world running on port ${launchPort}` : `✅ World exited successfully`);
}
