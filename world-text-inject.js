#!/usr/bin/env node
/**
 * World Text Inject - Inject colored text streams into running Docker worlds
 * Features pattern generation, color effects, and synchronized injection
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');
const WebSocket = require('ws');
const net = require('net');

// Text pattern generators
const PATTERNS = {
  wave: (t, i) => {
    const amplitude = 5;
    const frequency = 0.1;
    return Math.sin((t + i) * frequency) * amplitude;
  },
  
  pulse: (t, i) => {
    const period = 2000; // ms
    return Math.sin((t % period) / period * Math.PI * 2) * 10;
  },
  
  spiral: (t, i) => {
    const angle = (t + i * 100) * 0.01;
    return {
      x: Math.cos(angle) * 20,
      y: Math.sin(angle) * 20
    };
  },
  
  cascade: (t, i) => {
    const speed = 0.5;
    return (t * speed + i * 10) % 100;
  },
  
  random: (t, i) => {
    return Math.random() * 50;
  }
};

// Color generators
const COLOR_EFFECTS = {
  rainbow: (t, i) => {
    const hue = ((t * 0.1 + i * 10) % 360);
    return hslToRgb(hue, 100, 50);
  },
  
  gradient: (t, i, color1, color2) => {
    const factor = (Math.sin(t * 0.001 + i * 0.1) + 1) / 2;
    return interpolateColor(color1, color2, factor);
  },
  
  pulse: (t, i, baseColor) => {
    const brightness = (Math.sin(t * 0.01) + 1) / 2;
    return adjustBrightness(baseColor, brightness);
  },
  
  fire: (t, i) => {
    const temp = Math.random() * 0.5 + 0.5;
    return {
      r: 255,
      g: Math.floor(255 * temp),
      b: Math.floor(100 * temp)
    };
  },
  
  ocean: (t, i) => {
    const wave = Math.sin(t * 0.001 + i * 0.1);
    return {
      r: 0,
      g: Math.floor(100 + wave * 50),
      b: Math.floor(200 + wave * 55)
    };
  }
};

// Text content generators
const TEXT_GENERATORS = {
  lorem: () => {
    const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];
    return words[Math.floor(Math.random() * words.length)];
  },
  
  code: () => {
    const snippets = ['function()', 'const x =', 'if (true)', 'return false', '=> {', '});', 'async', 'await'];
    return snippets[Math.floor(Math.random() * snippets.length)];
  },
  
  emoji: () => {
    const emojis = ['🌟', '💫', '✨', '🌈', '🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🎹', '🥁'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  },
  
  numbers: () => {
    return Math.floor(Math.random() * 1000).toString();
  },
  
  binary: () => {
    return Math.random() > 0.5 ? '1' : '0';
  },
  
  custom: (text) => {
    return text[Math.floor(Math.random() * text.length)];
  }
};

// Helper functions
function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function interpolateColor(color1, color2, factor) {
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * factor),
    g: Math.round(color1.g + (color2.g - color1.g) * factor),
    b: Math.round(color1.b + (color2.b - color1.b) * factor)
  };
}

function adjustBrightness(color, brightness) {
  return {
    r: Math.min(255, Math.round(color.r * brightness)),
    g: Math.min(255, Math.round(color.g * brightness)),
    b: Math.min(255, Math.round(color.b * brightness))
  };
}

class TextInjector {
  constructor() {
    this.worlds = [];
    this.selectedWorld = null;
    this.injectionConfig = {
      pattern: 'wave',
      colorEffect: 'rainbow',
      textGenerator: 'lorem',
      speed: 100, // ms between injections
      streams: 1,
      duration: 0 // 0 = infinite
    };
    this.isInjecting = false;
    this.startTime = Date.now();
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async init() {
    console.clear();
    await this.loadRunningWorlds();
    
    if (this.worlds.length === 0) {
      console.log('\x1b[33mNo running Docker worlds found.\x1b[0m');
      console.log('Start a world first with: node world-launch.js <world-name>');
      process.exit(0);
    }
    
    await this.selectWorld();
    await this.configureInjection();
    await this.startInjection();
  }

  async loadRunningWorlds() {
    console.log('\x1b[36mSearching for running Docker worlds...\x1b[0m\n');
    
    const dirs = fs.readdirSync(process.cwd(), { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const dir of dirs) {
      const worldPath = path.join(process.cwd(), dir, 'world.json');
      if (fs.existsSync(worldPath)) {
        try {
          const worldData = JSON.parse(fs.readFileSync(worldPath, 'utf-8'));
          
          // Check if container is running
          try {
            const containerId = execSync(
              `docker ps --filter ancestor=${worldData.image} --format "{{.ID}}"`,
              { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
            ).trim();
            
            if (containerId) {
              this.worlds.push({
                ...worldData,
                directory: dir,
                containerId: containerId.split('\n')[0]
              });
            }
          } catch (e) {
            // Container not running
          }
        } catch (e) {
          // Invalid world.json
        }
      }
    }
  }

  async selectWorld() {
    console.log('\x1b[1mSelect a world to inject data into:\x1b[0m\n');
    
    this.worlds.forEach((world, index) => {
      console.log(`  ${index + 1}. \x1b[35m${world.name}\x1b[0m - ${world.description}`);
    });
    
    return new Promise((resolve) => {
      this.rl.question('\nEnter world number: ', (answer) => {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < this.worlds.length) {
          this.selectedWorld = this.worlds[index];
          console.log(`\nSelected: \x1b[32m${this.selectedWorld.name}\x1b[0m`);
          resolve();
        } else {
          console.log('\x1b[31mInvalid selection\x1b[0m');
          process.exit(1);
        }
      });
    });
  }

  async configureInjection() {
    console.clear();
    console.log(`\x1b[1mConfiguring injection for ${this.selectedWorld.name}\x1b[0m\n`);
    
    // Pattern selection
    console.log('\x1b[36mAvailable patterns:\x1b[0m');
    console.log('  1. Wave - Sinusoidal wave motion');
    console.log('  2. Pulse - Rhythmic pulsing');
    console.log('  3. Spiral - Spiral motion');
    console.log('  4. Cascade - Waterfall effect');
    console.log('  5. Random - Chaotic movement');
    
    await this.askConfig('Pattern (1-5)', (answer) => {
      const patterns = ['wave', 'pulse', 'spiral', 'cascade', 'random'];
      this.injectionConfig.pattern = patterns[parseInt(answer) - 1] || 'wave';
    });
    
    // Color effect selection
    console.log('\n\x1b[36mAvailable color effects:\x1b[0m');
    console.log('  1. Rainbow - Full spectrum cycling');
    console.log('  2. Fire - Warm fire colors');
    console.log('  3. Ocean - Cool ocean colors');
    console.log('  4. Pulse - Pulsing brightness');
    
    await this.askConfig('Color effect (1-4)', (answer) => {
      const effects = ['rainbow', 'fire', 'ocean', 'pulse'];
      this.injectionConfig.colorEffect = effects[parseInt(answer) - 1] || 'rainbow';
    });
    
    // Text generator selection
    console.log('\n\x1b[36mAvailable text generators:\x1b[0m');
    console.log('  1. Lorem - Lorem ipsum text');
    console.log('  2. Code - Code snippets');
    console.log('  3. Emoji - Colorful emojis');
    console.log('  4. Numbers - Random numbers');
    console.log('  5. Binary - Binary stream');
    
    await this.askConfig('Text generator (1-5)', (answer) => {
      const generators = ['lorem', 'code', 'emoji', 'numbers', 'binary'];
      this.injectionConfig.textGenerator = generators[parseInt(answer) - 1] || 'lorem';
    });
    
    // Other configurations
    await this.askConfig('Number of streams (1-10)', (answer) => {
      this.injectionConfig.streams = Math.min(10, Math.max(1, parseInt(answer) || 1));
    });
    
    await this.askConfig('Speed in ms (10-1000)', (answer) => {
      this.injectionConfig.speed = Math.min(1000, Math.max(10, parseInt(answer) || 100));
    });
    
    console.log('\n\x1b[32mConfiguration complete!\x1b[0m');
    console.log(JSON.stringify(this.injectionConfig, null, 2));
  }

  askConfig(question, handler) {
    return new Promise((resolve) => {
      this.rl.question(`${question}: `, (answer) => {
        handler(answer);
        resolve();
      });
    });
  }

  async startInjection() {
    console.log('\n\x1b[33mStarting injection...\x1b[0m');
    console.log('\x1b[2mPress Ctrl+C to stop\x1b[0m\n');
    
    this.isInjecting = true;
    const streams = [];
    
    // Create injection streams
    for (let i = 0; i < this.injectionConfig.streams; i++) {
      streams.push(this.createStream(i));
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n\x1b[31mStopping injection...\x1b[0m');
      this.isInjecting = false;
      
      // Show statistics
      const duration = (Date.now() - this.startTime) / 1000;
      console.log(`\n\x1b[36mInjection Statistics:\x1b[0m`);
      console.log(`  Duration: ${duration.toFixed(1)}s`);
      console.log(`  Pattern: ${this.injectionConfig.pattern}`);
      console.log(`  Color: ${this.injectionConfig.colorEffect}`);
      console.log(`  Streams: ${this.injectionConfig.streams}`);
      
      process.exit(0);
    });
    
    // Keep process alive
    setInterval(() => {
      if (!this.isInjecting) process.exit(0);
    }, 100);
  }

  createStream(streamIndex) {
    const inject = () => {
      if (!this.isInjecting) return;
      
      const t = Date.now() - this.startTime;
      
      // Generate text
      const textGen = TEXT_GENERATORS[this.injectionConfig.textGenerator];
      const text = textGen();
      
      // Generate position
      const pattern = PATTERNS[this.injectionConfig.pattern];
      const position = pattern(t, streamIndex);
      
      // Generate color
      const colorGen = COLOR_EFFECTS[this.injectionConfig.colorEffect];
      const color = colorGen(t, streamIndex);
      
      // Create injection payload
      const payload = {
        stream: streamIndex,
        text: text,
        position: position,
        color: color,
        timestamp: t
      };
      
      // Inject into container
      this.injectIntoContainer(payload);
      
      // Schedule next injection
      setTimeout(inject, this.injectionConfig.speed);
    };
    
    // Start with random delay to desync streams
    setTimeout(inject, Math.random() * this.injectionConfig.speed);
  }

  injectIntoContainer(payload) {
    // For now, we'll output to console
    // In a real implementation, this would communicate with the container
    const colorCode = `\x1b[38;2;${payload.color.r};${payload.color.g};${payload.color.b}m`;
    const position = typeof payload.position === 'object' ? 
      `(${Math.round(payload.position.x)},${Math.round(payload.position.y)})` : 
      Math.round(payload.position);
    
    console.log(
      `Stream ${payload.stream}: ${colorCode}${payload.text}\x1b[0m @ ${position}`
    );
  }
}

// Check if ws module is available
try {
  require.resolve('ws');
} catch(e) {
  console.log('\x1b[33mNote: Install ws module for WebSocket support\x1b[0m');
  console.log('Run: npm install ws\n');
}

// Start the injector
const injector = new TextInjector();
injector.init().catch(err => {
  console.error('\x1b[31mError:\x1b[0m', err);
  process.exit(1);
});