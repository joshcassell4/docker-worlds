#!/usr/bin/env node
/**
 * Log Theater World - Where logs perform on stage
 * Watch as different log types enter and exit dramatically with colors and effects
 */

const blessed = require('blessed');
const figlet = require('figlet');
const faker = require('faker');

// Log actor definitions - using ASCII-safe characters
const LOG_ACTORS = {
  INFO: {
    color: 'cyan',
    entrance: 'left',
    symbol: '[i]',
    messages: [
      'System initialized successfully',
      'Connection established to server',
      'Cache refreshed',
      'User session started',
      'Background task completed'
    ]
  },
  SUCCESS: {
    color: 'green',
    entrance: 'right',
    symbol: '[OK]',
    messages: [
      'Operation completed successfully!',
      'All tests passed!',
      'Deployment successful!',
      'Data saved to database',
      'File upload complete'
    ]
  },
  WARN: {
    color: 'yellow',
    entrance: 'top',
    symbol: '[!]',
    messages: [
      'High memory usage detected',
      'Rate limit approaching',
      'Deprecated API usage',
      'Slow response time',
      'Cache miss rate high'
    ]
  },
  ERROR: {
    color: 'red',
    entrance: 'bottom',
    symbol: '[X]',
    messages: [
      'Connection timeout!',
      'Invalid authentication token!',
      'File not found!',
      'Database connection failed!',
      'Out of memory error!'
    ],
    effect: 'blink'
  },
  DEBUG: {
    color: 'magenta',
    entrance: 'fade',
    symbol: '[D]',
    messages: [
      'Entering function processData()',
      'Variable state: { loaded: true }',
      'SQL Query: SELECT * FROM users',
      'Request headers: { auth: "Bearer..." }',
      'Memory usage: 45.2MB'
    ]
  }
};

// Stage effects
const EFFECTS = {
  spotlight: (box, intensity) => {
    const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
    box.style.bg = `gray${Math.floor(pulse * intensity * 10)}`;
  },
  
  shake: (box, intensity) => {
    const offset = Math.sin(Date.now() / 50) * intensity;
    box.left = box.originalLeft + Math.floor(offset);
  },
  
  pulse: (box, intensity) => {
    const scale = Math.sin(Date.now() / 300) * 0.2 + 1;
    box.height = Math.floor(box.originalHeight * scale);
  }
};

class LogTheater {
  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Log Theater World',
      fullUnicode: false,  // Disable Unicode to avoid issues
      forceUnicode: false,
      dockBorders: true,
      cursor: {
        artificial: true,
        blink: false,
        shape: 'underline'
      }
    });

    this.logs = [];
    this.stages = [];
    this.currentAct = 1;
    this.isPaused = false;
    
    this.setupStage();
    this.setupControls();
    this.startShow();
  }

  setupStage() {
    // Create title
    this.titleBox = blessed.box({
      top: 0,
      left: 'center',
      width: '100%',
      height: 5,
      content: this.createTitle(),
      tags: false,  // Disable tags
      align: 'center',
      style: {
        fg: 'yellow',
        bold: true,
        bg: 'black'
      }
    });

    // Create main stage area
    this.stageBox = blessed.box({
      top: 5,
      left: 0,
      width: '100%',
      height: '70%',
      label: ' { Stage } ',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'bright-magenta'
        }
      }
    });

    // Create three stage levels
    for (let i = 0; i < 3; i++) {
      const stage = blessed.box({
        top: `${30 * i + 10}%`,
        left: 0,
        width: '100%',
        height: '25%',
        tags: true
      });
      this.stages.push(stage);
      this.stageBox.append(stage);
    }

    // Create info panel
    this.infoBox = blessed.box({
      bottom: 0,
      left: 0,
      width: '50%',
      height: 6,
      label: ' { Director\'s Notes } ',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'bright-cyan'
        }
      },
      content: this.getInfoContent()
    });

    // Create stats panel
    this.statsBox = blessed.box({
      bottom: 0,
      right: 0,
      width: '50%',
      height: 6,
      label: ' { Performance Stats } ',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'bright-green'
        }
      }
    });

    // Append all to screen
    this.screen.append(this.titleBox);
    this.screen.append(this.stageBox);
    this.screen.append(this.infoBox);
    this.screen.append(this.statsBox);
  }

  createTitle() {
    const title = figlet.textSync('Log Theater', {
      font: 'Standard',
      horizontalLayout: 'fitted'
    });
    
    return title;
  }

  getInfoContent() {
    return `Act ${this.currentAct}: "The Logs Must Go On"\n` +
           `[Space] Pause/Resume  [↑/↓] Speed\n` +
           `[1-5] Trigger Actor  [Q] Exit`;
  }

  setupControls() {
    this.screen.key(['space'], () => {
      this.isPaused = !this.isPaused;
      this.updateStats();
    });

    this.screen.key(['up'], () => {
      this.speed = Math.max(500, (this.speed || 2000) - 200);
    });

    this.screen.key(['down'], () => {
      this.speed = Math.min(5000, (this.speed || 2000) + 200);
    });

    this.screen.key(['1'], () => this.spawnActor('INFO'));
    this.screen.key(['2'], () => this.spawnActor('SUCCESS'));
    this.screen.key(['3'], () => this.spawnActor('WARN'));
    this.screen.key(['4'], () => this.spawnActor('ERROR'));
    this.screen.key(['5'], () => this.spawnActor('DEBUG'));

    this.screen.key(['q', 'C-c'], () => {
      this.cleanup();
      process.exit(0);
    });
  }

  spawnActor(type) {
    if (this.isPaused) return;

    const actor = LOG_ACTORS[type];
    const stageIndex = Math.floor(Math.random() * this.stages.length);
    const stage = this.stages[stageIndex];
    
    // Create log entry
    const timestamp = new Date().toLocaleTimeString();
    const message = actor.messages[Math.floor(Math.random() * actor.messages.length)];
    const logId = Date.now();

    // Create log box
    const logBox = blessed.box({
      width: message.length + 20,
      height: 3,
      left: this.getEntrancePosition(actor.entrance, stage),
      tags: true,
      border: {
        type: 'round'
      },
      style: {
        fg: actor.color,
        border: {
          fg: actor.color
        }
      }
    });

    // Store original position for effects
    logBox.originalLeft = 0;
    logBox.originalHeight = 3;

    // Set content without tags (use style property instead)
    const content = `${actor.symbol} [${timestamp}] ${type}\n${message}`;
    logBox.setContent(content);

    // Add to stage
    stage.append(logBox);
    this.logs.push({
      id: logId,
      box: logBox,
      type: type,
      stage: stageIndex,
      position: 0,
      targetPosition: this.getTargetPosition(stage),
      speed: 0.5 + Math.random(),
      lifetime: 10000 + Math.random() * 5000
    });

    // Apply entrance effect
    this.applyEntranceEffect(logBox, actor.entrance);
    
    this.screen.render();
  }

  getEntrancePosition(entrance, stage) {
    switch (entrance) {
      case 'left': return -30;
      case 'right': return stage.width + 10;
      case 'top': return Math.floor(Math.random() * (stage.width - 30));
      case 'bottom': return Math.floor(Math.random() * (stage.width - 30));
      default: return Math.floor(Math.random() * (stage.width - 30));
    }
  }

  getTargetPosition(stage) {
    return Math.floor(Math.random() * (stage.width - 40)) + 10;
  }

  applyEntranceEffect(box, entrance) {
    // Add entrance animations based on type
    if (entrance === 'fade') {
      box.style.transparent = true;
      setTimeout(() => {
        box.style.transparent = false;
        this.screen.render();
      }, 100);
    }
  }

  updateLogs() {
    if (this.isPaused) return;

    const now = Date.now();
    this.logs = this.logs.filter(log => {
      // Check lifetime
      if (now - log.id > log.lifetime) {
        log.box.detach();
        return false;
      }

      // Move log towards target
      const currentLeft = parseInt(log.box.left) || 0;
      const diff = log.targetPosition - currentLeft;
      
      if (Math.abs(diff) > 1) {
        log.box.left = currentLeft + Math.sign(diff) * Math.ceil(log.speed);
      }

      // Apply effects
      const actor = LOG_ACTORS[log.type];
      if (actor.effect === 'blink' && Math.random() > 0.9) {
        log.box.style.inverse = !log.box.style.inverse;
      }

      // Spotlight effect for errors
      if (log.type === 'ERROR') {
        EFFECTS.spotlight(log.box, 5);
      }

      return true;
    });
  }

  updateStats() {
    const stats = {
      INFO: 0,
      SUCCESS: 0,
      WARN: 0,
      ERROR: 0,
      DEBUG: 0
    };

    this.logs.forEach(log => {
      stats[log.type]++;
    });

    const content = Object.entries(stats)
      .map(([type, count]) => {
        const actor = LOG_ACTORS[type];
        return `${actor.symbol} ${type}: ${count}`;
      })
      .join('  ');

    this.statsBox.setContent(content);
  }

  startShow() {
    this.speed = 2000;
    
    // Main animation loop
    setInterval(() => {
      this.updateLogs();
      this.updateStats();
      this.screen.render();
    }, 50);

    // Spawn random logs
    setInterval(() => {
      if (!this.isPaused && this.logs.length < 10) {
        const types = Object.keys(LOG_ACTORS);
        const randomType = types[Math.floor(Math.random() * types.length)];
        this.spawnActor(randomType);
      }
    }, this.speed || 2000);

    // Change acts
    setInterval(() => {
      this.currentAct = (this.currentAct % 3) + 1;
      this.infoBox.setContent(this.getInfoContent());
      this.screen.render();
    }, 30000);

    this.screen.render();
  }

  cleanup() {
    this.screen.destroy();
    console.log('\n\x1b[35mThe curtain falls on Log Theater World...\x1b[0m\n');
  }
}

// Start the show
console.clear();
console.log('\x1b[33mPreparing the stage for Log Theater World...\x1b[0m\n');
setTimeout(() => {
  const theater = new LogTheater();
}, 1000);