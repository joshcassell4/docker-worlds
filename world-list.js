#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const catalogPath = path.join(os.homedir(), 'docker-worlds', 'catalog.json');

if (!fs.existsSync(catalogPath)) {
  console.error('❌ No catalog.json found. Run `generate-catalog.js` first.');
  process.exit(1);
}

const worlds = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

if (worlds.length === 0) {
  console.log('⚠️  No worlds found in the catalog.');
  process.exit(0);
}

// Pretty print
console.log('🌍 Available Docker Worlds\n');
console.log('Name'.padEnd(20), 'Type'.padEnd(8), 'Port'.padEnd(6), 'Tags');
console.log('-'.repeat(60));

worlds.forEach(world => {
  const name = (world.name || '').padEnd(20);
  const type = (world.type || '').padEnd(8);
  const port = (world.port?.toString() || '-').padEnd(6);
  const tags = Array.isArray(world.tags) ? world.tags.join(', ') : '';
  console.log(name, type, port, tags);
});

console.log(`\n🧭 Total: ${worlds.length} world(s) listed.`);
