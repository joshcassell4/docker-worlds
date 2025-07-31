#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// --- Parse CLI Arguments ---
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('❌ Usage: node world-init.js <world-name> [--type=web|cli] [--desc="..."] [--port=8080] [--entry="npm start"] [--tags=tag1,tag2]');
  process.exit(1);
}

const worldName = args[0];
const options = {
  type: 'web',
  desc: `A Docker-contained world called "${worldName}"`,
  port: 8080,
  entry: 'npm start',
  tags: ['interactive', 'docker']
};

// Parse additional flags
args.slice(1).forEach(arg => {
  const [key, value] = arg.split('=');
  if (!value) return;

  if (key === '--type') options.type = value;
  if (key === '--desc') options.desc = value;
  if (key === '--port') options.port = parseInt(value);
  if (key === '--entry') options.entry = value;
  if (key === '--tags') options.tags = value.split(',').map(t => t.trim());
});

// --- Create Folder Structure ---
const root = path.join(process.cwd(), worldName);
const appDir = path.join(root, 'app');

if (fs.existsSync(root)) {
  console.error('❌ Directory already exists. Choose a different world name.');
  process.exit(1);
}

fs.mkdirSync(appDir, { recursive: true });

// --- Create world.json ---
const worldConfig = {
  name: worldName,
  image: `ghcr.io/your-namespace/${worldName}`,
  description: options.desc,
  entry: options.entry,
  type: options.type,
  port: options.port,
  tags: options.tags
};

fs.writeFileSync(
  path.join(root, 'world.json'),
  JSON.stringify(worldConfig, null, 2),
  'utf-8'
);

// --- Create Dockerfile + Starter App ---
if (options.type === 'web') {
  const dockerfile = `
FROM nginx:alpine
COPY ./app /usr/share/nginx/html
EXPOSE 80
  `.trim();
  fs.writeFileSync(path.join(root, 'Dockerfile'), dockerfile, 'utf-8');

  const html = `
<!DOCTYPE html>
<html>
<head><title>${worldName}</title></head>
<body>
  <h1>Welcome to ${worldName}!</h1>
  <p>This is your new web-based Docker world.</p>
</body>
</html>
  `.trim();
  fs.writeFileSync(path.join(appDir, 'index.html'), html, 'utf-8');
}

if (options.type === 'cli') {
  const dockerfile = `
FROM node:18-alpine
WORKDIR /app
COPY ./app /app
CMD ["node", "main.js"]
  `.trim();
  fs.writeFileSync(path.join(root, 'Dockerfile'), dockerfile, 'utf-8');

  const script = `
console.log("Welcome to the CLI world of ${worldName}!");
let count = 0;
setInterval(() => {
  count++;
  console.log("You are still here... " + count + " ticks into this world.");
}, 2000);
  `.trim();
  fs.writeFileSync(path.join(appDir, 'main.js'), script, 'utf-8');
}

// --- Done ---
console.log(`✅ Created world "${worldName}"`);
console.log(`➡️ Build:   docker build -t ${worldName} .`);
if (options.type === 'web') {
  console.log(`➡️ Run:     docker run --rm -p ${options.port}:80 ${worldName}`);
  console.log(`🌐 Visit:   http://localhost:${options.port}`);
}
if (options.type === 'cli') {
  console.log(`➡️ Run:     docker run --rm -it ${worldName}`);
}
