#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, spawnSync, execSync } = require('child_process');

// --- CLI argument parsing ---
const args = process.argv.slice(2);
const inputDir = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-')) || '.';
const absoluteDir = path.resolve(inputDir);
const portOverride = getArg('--port');
let detached = args.includes('--detach') || args.includes('-d');

function getArg(flag) {
  const entry = args.find(arg => arg.startsWith(flag + '='));
  return entry ? entry.split('=')[1] : null;
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true });
  } else if (process.platform === 'darwin') {
    spawn('open', [url], { stdio: 'ignore', detached: true });
  } else {
    spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
  }
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
if (world.type === 'cli') {
  console.log(`🧩 Running in CLI mode`);
  detached = false;
}
if (detached) console.log(`🧩 Running in detached mode`);
console.log('');

// --- Check if Docker image exists locally ---
try {
  execSync(`docker image inspect ${image}`, { stdio: 'ignore' });
} catch {
  const dockerfilePath = path.join(worldDir, 'Dockerfile');

  if (fs.existsSync(dockerfilePath)) {
    console.log(`🔧 Image not found. Building Docker image...`);
    const buildResult = spawnSync('docker', ['build', '-t', image, worldDir], { stdio: 'inherit' });

    if (buildResult.status !== 0) {
      console.error('❌ Docker build failed. Aborting launch.');
      process.exit(1);
    }
  } else {
    console.error(`❌ Dockerfile not found. Cannot build missing image.`);
    process.exit(1);
  }
}

// --- Construct docker args ---
const dockerArgs = ['run', '--rm'];
if (world.type === 'web') {
  dockerArgs.push('-p', `${launchPort}:80`);
  if (world.volumeMount) {
    console.log(`📦 Mounting volume from ${absoluteDir} to /app`);
    dockerArgs.push('-v', `${absoluteDir}:/app`);
  }
} else if (world.type === 'cli') {
  dockerArgs.push('-it');
} else {
  console.error(`❌ Unknown world type: "${world.type}"`);
  process.exit(1);
}

if (detached) dockerArgs.push('-d');
dockerArgs.push(image);

// --- Launch docker container ---
console.log(`▶️ docker ${dockerArgs.join(' ')}`);
const dockerProc = spawn('docker', dockerArgs, { stdio: 'inherit' });

// 🌐 Always launch browser in parallel for web worlds
if (world.type === 'web') {
  const url = `http://localhost:${launchPort}`;
  console.log(`🌐 Opening browser at ${url}...`);
  setTimeout(() => openBrowser(url), 1000); // give container a second to start
}

// --- On exit ---
dockerProc.on('exit', (code) => {
  if (detached) {
    console.log(`✅ Detached world running on port ${launchPort}`);
  } else {
    console.log(`✅ Docker exited with code ${code}`);
  }
});
