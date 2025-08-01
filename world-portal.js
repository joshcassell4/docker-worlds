#!/usr/bin/env node
/**
 * World Portal - A unified interface to navigate between Docker worlds
 * Features ASCII art previews and colorful text animations
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// ASCII art for different world types
const WORLD_PREVIEWS = {
  'text-symphony-world': `
    ♪ ♫ ♬ ♩ ♮ ♯ ♭
   ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈
  ∼∼∼ TEXT ∼∼∼∼∼∼∼
 ∿∿ SYMPHONY ∿∿∿∿∿∿
  ≋≋≋ WORLD ≋≋≋≋≋≋
   ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈
    ♪ ♫ ♬ ♩ ♮ ♯ ♭`,
    
  'log-theater-world': `
   ╔══ STAGE ══╗
   ║ [INFO] ───→║
   ║←─ [ERROR!] ║
   ║ [WARN] ↓   ║
   ║   ↑ [DEBUG]║
   ╚════════════╝
   🎭 LOG THEATER`,
   
  'data-matrix-world': `
   │0│1│0│1│1│0│1│
   │1│0│1│0│0│1│0│
   │0│1│1│0│1│0│1│
   │M│A│T│R│I│X│!│
   │1│0│0│1│0│1│1│
   │0│1│1│0│1│0│0│
   ▼ ▼ ▼ ▼ ▼ ▼ ▼`,
   
  'terminal-garden-world': `
      🌱  🌿  🌳
     /│\\  /│\\  /│\\
    / │ \\ │ │  │ │
   ═══╧═══╧═══╧═══
   DIGITAL GARDEN`,
   
  'command-center-world': `
   ┌─STATUS─┬─LOGS──┐
   │ ▓▓▓░░░ │ >>>>> │
   ├─METRICS┼─ALERT─┤
   │ ↗↘↗↘↗↘ │ ⚠️ !!! │
   └────────┴───────┘
   COMMAND CENTER`,
   
  'default': `
   ┌─────────────┐
   │   DOCKER    │
   │    WORLD    │
   │      🌍     │
   └─────────────┘`
};

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m'
};

class WorldPortal {
  constructor() {
    this.worlds = [];
    this.selectedIndex = 0;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Enable keypress events
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
  }

  async init() {
    console.clear();
    await this.loadWorlds();
    this.showPortal();
    this.handleInput();
  }

  async loadWorlds() {
    console.log(`${colors.cyan}${colors.bright}Loading Docker Worlds...${colors.reset}\n`);
    
    const dirs = fs.readdirSync(process.cwd(), { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const dir of dirs) {
      const worldPath = path.join(process.cwd(), dir, 'world.json');
      if (fs.existsSync(worldPath)) {
        try {
          const worldData = JSON.parse(fs.readFileSync(worldPath, 'utf-8'));
          
          // Check if container is running
          let isRunning = false;
          try {
            const output = execSync(`docker ps --filter ancestor=${worldData.image} --format "{{.ID}}"`, { 
              encoding: 'utf-8',
              stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
            isRunning = output.length > 0;
          } catch (e) {
            // Container not running
          }
          
          this.worlds.push({
            ...worldData,
            directory: dir,
            isRunning,
            preview: WORLD_PREVIEWS[worldData.name] || WORLD_PREVIEWS.default
          });
        } catch (e) {
          console.error(`Failed to load ${dir}: ${e.message}`);
        }
      }
    }
    
    if (this.worlds.length === 0) {
      console.log(`${colors.yellow}No Docker Worlds found in current directory.${colors.reset}`);
      console.log(`Run ${colors.cyan}node world-init.js <world-name>${colors.reset} to create one.`);
      process.exit(0);
    }
  }

  showPortal() {
    console.clear();
    this.renderTitle();
    this.renderWorldList();
    this.renderPreview();
    this.renderControls();
  }

  renderTitle() {
    const title = `
${colors.bright}${colors.magenta}╔═══════════════════════════════════════════════════════╗
║                  DOCKER WORLD PORTAL                  ║
╚═══════════════════════════════════════════════════════╝${colors.reset}`;
    console.log(title);
  }

  renderWorldList() {
    console.log(`\n${colors.bright}Available Worlds:${colors.reset}\n`);
    
    this.worlds.forEach((world, index) => {
      const isSelected = index === this.selectedIndex;
      const prefix = isSelected ? '▶ ' : '  ';
      const statusIcon = world.isRunning ? '🟢' : '⚫';
      const highlight = isSelected ? colors.bgBlue + colors.white : '';
      const reset = isSelected ? colors.reset : '';
      
      console.log(
        `${highlight}${prefix}${statusIcon} ${world.name.padEnd(25)} ` +
        `[${world.type}] ${world.description.substring(0, 40)}...${reset}`
      );
    });
  }

  renderPreview() {
    const world = this.worlds[this.selectedIndex];
    console.log(`\n${colors.bright}Preview:${colors.reset}`);
    
    // Apply color to preview based on world type
    let previewColor = colors.cyan;
    if (world.type === 'cli') previewColor = colors.green;
    if (world.name.includes('matrix')) previewColor = colors.green;
    if (world.name.includes('theater')) previewColor = colors.yellow;
    if (world.name.includes('symphony')) previewColor = colors.magenta;
    
    const preview = world.preview.split('\n').map(line => 
      `  ${previewColor}${line}${colors.reset}`
    ).join('\n');
    
    console.log(preview);
    
    // Show world details
    console.log(`\n${colors.bright}Details:${colors.reset}`);
    console.log(`  ${colors.dim}Image:${colors.reset} ${world.image}`);
    console.log(`  ${colors.dim}Port:${colors.reset} ${world.port || 'N/A'}`);
    console.log(`  ${colors.dim}Tags:${colors.reset} ${(world.tags || []).join(', ')}`);
    console.log(`  ${colors.dim}Status:${colors.reset} ${world.isRunning ? colors.green + 'Running' : colors.red + 'Stopped'}${colors.reset}`);
  }

  renderControls() {
    console.log(`\n${colors.bright}Controls:${colors.reset}`);
    console.log(`  ${colors.cyan}↑/↓${colors.reset} Navigate   ${colors.cyan}Enter${colors.reset} Launch   ${colors.cyan}S${colors.reset} Stop`);
    console.log(`  ${colors.cyan}I${colors.reset} Inject Data   ${colors.cyan}L${colors.reset} View Logs   ${colors.cyan}R${colors.reset} Refresh`);
    console.log(`  ${colors.cyan}Q${colors.reset} Quit Portal`);
  }

  handleInput() {
    process.stdin.on('keypress', async (ch, key) => {
      if (!key) return;
      
      switch (key.name) {
        case 'up':
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.showPortal();
          break;
          
        case 'down':
          this.selectedIndex = Math.min(this.worlds.length - 1, this.selectedIndex + 1);
          this.showPortal();
          break;
          
        case 'return':
          await this.launchWorld();
          break;
          
        case 's':
          await this.stopWorld();
          break;
          
        case 'i':
          await this.injectData();
          break;
          
        case 'l':
          await this.viewLogs();
          break;
          
        case 'r':
          await this.loadWorlds();
          this.showPortal();
          break;
          
        case 'q':
        case 'escape':
          this.quit();
          break;
      }
    });
  }

  async launchWorld() {
    const world = this.worlds[this.selectedIndex];
    console.clear();
    console.log(`${colors.bright}${colors.green}Launching ${world.name}...${colors.reset}\n`);
    
    // Show animated loading
    const loadingFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frame = 0;
    const loadingInterval = setInterval(() => {
      process.stdout.write(`\r${colors.cyan}${loadingFrames[frame]} Preparing world...${colors.reset}`);
      frame = (frame + 1) % loadingFrames.length;
    }, 100);
    
    // Launch the world
    const worldProcess = spawn('node', ['world-launch.js', world.directory], {
      stdio: 'inherit'
    });
    
    clearInterval(loadingInterval);
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
    
    worldProcess.on('exit', () => {
      console.log(`\n${colors.yellow}Returned to portal${colors.reset}`);
      setTimeout(() => {
        this.loadWorlds().then(() => this.showPortal());
      }, 1000);
    });
  }

  async stopWorld() {
    const world = this.worlds[this.selectedIndex];
    if (!world.isRunning) {
      console.log(`\n${colors.yellow}World is not running${colors.reset}`);
      setTimeout(() => this.showPortal(), 1000);
      return;
    }
    
    console.log(`\n${colors.yellow}Stopping ${world.name}...${colors.reset}`);
    
    try {
      execSync(`node world-stop.js ${world.directory}`, { stdio: 'inherit' });
      await this.loadWorlds();
      this.showPortal();
    } catch (e) {
      console.error(`${colors.red}Failed to stop world${colors.reset}`);
      setTimeout(() => this.showPortal(), 2000);
    }
  }

  async injectData() {
    const world = this.worlds[this.selectedIndex];
    if (!world.isRunning) {
      console.log(`\n${colors.yellow}World must be running to inject data${colors.reset}`);
      setTimeout(() => this.showPortal(), 1000);
      return;
    }
    
    console.log(`\n${colors.cyan}Data injection coming soon!${colors.reset}`);
    console.log(`Will inject data into ${world.name}`);
    setTimeout(() => this.showPortal(), 2000);
  }

  async viewLogs() {
    const world = this.worlds[this.selectedIndex];
    if (!world.isRunning) {
      console.log(`\n${colors.yellow}World must be running to view logs${colors.reset}`);
      setTimeout(() => this.showPortal(), 1000);
      return;
    }
    
    console.clear();
    console.log(`${colors.bright}Viewing logs for ${world.name}${colors.reset}`);
    console.log(`${colors.dim}Press Ctrl+C to return to portal${colors.reset}\n`);
    
    try {
      const containerId = execSync(
        `docker ps --filter ancestor=${world.image} --format "{{.ID}}" | head -1`,
        { encoding: 'utf-8' }
      ).trim();
      
      if (containerId) {
        const logsProcess = spawn('docker', ['logs', '-f', containerId], {
          stdio: 'inherit'
        });
        
        logsProcess.on('exit', () => {
          this.showPortal();
        });
      }
    } catch (e) {
      console.error(`${colors.red}Failed to get logs${colors.reset}`);
      setTimeout(() => this.showPortal(), 2000);
    }
  }

  quit() {
    console.clear();
    console.log(`${colors.bright}${colors.cyan}Thanks for visiting the Docker World Portal!${colors.reset}`);
    console.log(`${colors.dim}May your containers always run smoothly...${colors.reset}\n`);
    
    // Show farewell animation
    const message = "GOODBYE";
    let revealed = "";
    let i = 0;
    
    const farewellInterval = setInterval(() => {
      if (i < message.length) {
        revealed += message[i];
        process.stdout.write(`\r${colors.magenta}${revealed}${colors.dim}${'*'.repeat(message.length - i - 1)}${colors.reset}`);
        i++;
      } else {
        clearInterval(farewellInterval);
        console.log('\n');
        process.exit(0);
      }
    }, 150);
  }
}

// Start the portal
console.log(`${colors.bright}${colors.cyan}Initializing Docker World Portal...${colors.reset}`);
const portal = new WorldPortal();
portal.init().catch(err => {
  console.error(`${colors.red}Portal initialization failed:${colors.reset}`, err);
  process.exit(1);
});