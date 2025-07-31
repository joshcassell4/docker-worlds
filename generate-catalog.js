#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dockerWorldsPath = path.join(require('os').homedir(), 'docker-worlds');
const catalogPath = path.join(dockerWorldsPath, 'catalog.json');

console.log(`📁 Scanning ${dockerWorldsPath} for worlds...`);

const entries = [];

fs.readdirSync(dockerWorldsPath, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dirent => {
    const worldDir = path.join(dockerWorldsPath, dirent.name);
    const worldJsonPath = path.join(worldDir, 'world.json');

    if (fs.existsSync(worldJsonPath)) {
      try {
        const world = JSON.parse(fs.readFileSync(worldJsonPath, 'utf-8'));
        entries.push({
          name: world.name || dirent.name,
          description: world.description || "",
          image: world.image || "",
          type: world.type || "web",
          port: world.port || null,
          tags: world.tags || []
        });
        console.log(`✅ Found: ${world.name}`);
      } catch (err) {
        console.warn(`⚠️  Failed to parse world.json in ${dirent.name}: ${err.message}`);
      }
    } else {
      console.log(`⏭️  Skipped: ${dirent.name} (no world.json)`);
    }
  });

fs.writeFileSync(catalogPath, JSON.stringify(entries, null, 2), 'utf-8');
console.log(`\n📦 catalog.json written to ${catalogPath}`);
console.log(`🧭 Total worlds: ${entries.length}`);
