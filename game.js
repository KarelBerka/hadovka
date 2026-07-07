// Had: Cyber Neon Arena
// Game Engine, Controls, AI and Sound Synthesizer

// ----------------------------------------------------
// 1. GLOBALS & CONFIGURATION
// ----------------------------------------------------

const GRID_SIZE = 40;
const CANVAS_SIZE = 800;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE; // 20px

// Standard neon player configurations (up to 8 players)
const PLAYER_CONFIGS = [
  { id: 1, name: 'Hráč 1', color: '#00f2fe', rgb: '0, 242, 254', leftKey: 'ArrowLeft', rightKey: 'ArrowRight' },
  { id: 2, name: 'Hráč 2', color: '#ff007f', rgb: '255, 0, 127', leftKey: 'KeyA', rightKey: 'KeyD' },
  { id: 3, name: 'Hráč 3', color: '#39ff14', rgb: '57, 255, 20', leftKey: 'KeyJ', rightKey: 'KeyL' },
  { id: 4, name: 'Hráč 4', color: '#bd00ff', rgb: '189, 0, 255', leftKey: 'KeyF', rightKey: 'KeyG' },
  { id: 5, name: 'Hráč 5', color: '#ffe600', rgb: '255, 230, 0', leftKey: 'KeyV', rightKey: 'KeyB' },
  { id: 6, name: 'Hráč 6', color: '#ff6c00', rgb: '255, 108, 0', leftKey: 'KeyI', rightKey: 'KeyP' },
  { id: 7, name: 'Hráč 7', color: '#ff003c', rgb: '255, 0, 60', leftKey: 'KeyZ', rightKey: 'KeyX' },
  { id: 8, name: 'Hráč 8', color: '#0066ff', rgb: '0, 102, 255', leftKey: 'KeyN', rightKey: 'KeyM' }
];

// Spawning points around the arena (facing inward)
const SPAWN_POINTS = [
  { x: 5, y: 5, dirIndex: 1 },    // P1: Top-Left, facing Right
  { x: 34, y: 34, dirIndex: 3 },  // P2: Bottom-Right, facing Left
  { x: 34, y: 5, dirIndex: 2 },   // P3: Top-Right, facing Down
  { x: 5, y: 34, dirIndex: 0 },   // P4: Bottom-Left, facing Up
  { x: 20, y: 5, dirIndex: 2 },   // P5: Top-Middle, facing Down
  { x: 20, y: 34, dirIndex: 0 },  // P6: Bottom-Middle, facing Up
  { x: 5, y: 20, dirIndex: 1 },   // P7: Left-Middle, facing Right
  { x: 34, y: 20, dirIndex: 3 }   // P8: Right-Middle, facing Left
];

// Fruit Types with their properties
const FRUIT_TYPES = {
  NORMAL: { type: 'NORMAL', color: '#ff003c', shadow: '#ff003c', grow: 1, points: 10, prob: 0.7 },
  GOLDEN: { type: 'GOLDEN', color: '#ffe600', shadow: '#ffe600', grow: 2, points: 30, prob: 0.1, effect: 'boost', duration: 4000 },
  CHILI:  { type: 'CHILI',  color: '#ff6c00', shadow: '#ff6c00', grow: 1, points: 15, prob: 0.1, effect: 'boost', duration: 5000 },
  BERRY:  { type: 'BERRY',  color: '#0066ff', shadow: '#0066ff', grow: 1, points: 5,  prob: 0.1, effect: 'slow',  duration: 6000 }
};

// ----------------------------------------------------
// 2. AUDIO SYNTHESIZER (Web Audio API)
// ----------------------------------------------------
const SoundFX = {
  ctx: null,
  muted: false,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  play(type) {
    if (this.muted) return;
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    const now = this.ctx.currentTime;
    
    switch(type) {
      case 'turn': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }
      case 'eat': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
      case 'death': {
        // Synthesise low rumble explosion
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(20, now + 0.5);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      }
      case 'win': {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C major pentatonic sweep
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.05, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
        break;
      }
      case 'teleport': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
    }
  }
};

// ----------------------------------------------------
// 3. PARTICLE SYSTEM
// ----------------------------------------------------
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8;
    this.color = color;
    this.alpha = 1;
    this.decay = Math.random() * 0.02 + 0.015;
    this.size = Math.random() * 3 + 2;
  }
  update(dtRatio) {
    this.x += this.vx * dtRatio;
    this.y += this.vy * dtRatio;
    this.alpha -= this.decay * dtRatio;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ----------------------------------------------------
// 4. SNAKE CLASS
// ----------------------------------------------------
const DIRECTIONS = [
  { x: 0, y: -1 }, // 0: Up
  { x: 1, y: 0 },  // 1: Right
  { x: 0, y: 1 },  // 2: Down
  { x: -1, y: 0 }  // 3: Left
];

class Snake {
  constructor(game, config, spawn) {
    this.game = game;
    this.id = config.id;
    this.name = config.name;
    this.color = config.color;
    this.rgb = config.rgb;
    this.leftKey = config.leftKey;
    this.rightKey = config.rightKey;
    this.isBot = false; // Overwritten during lobby choices
    
    // Position and movement
    this.body = [];
    // Start with 4 segments
    for (let i = 0; i < 4; i++) {
      this.body.push({
        x: spawn.x - DIRECTIONS[spawn.dirIndex].x * i,
        y: spawn.y - DIRECTIONS[spawn.dirIndex].y * i
      });
    }
    
    this.dirIndex = spawn.dirIndex;
    
    // Turning logic buffers
    this.turnedThisTick = false;
    this.pendingTurn = null; // -1 for Left, 1 for Right
    
    // State
    this.alive = true;
    this.score = 0;
    
    // Speed accumulation for independent snake speeds
    this.timeAccumulator = 0;
    
    // Active effects
    this.activeEffect = null; // 'boost' or 'slow'
    this.effectTimer = 0; // ms remaining
  }

  turnLeft() {
    if (!this.alive) return;
    if (this.turnedThisTick) {
      this.pendingTurn = -1;
      return;
    }
    this.dirIndex = (this.dirIndex + 3) % 4;
    this.turnedThisTick = true;
    SoundFX.play('turn');
  }

  turnRight() {
    if (!this.alive) return;
    if (this.turnedThisTick) {
      this.pendingTurn = 1;
      return;
    }
    this.dirIndex = (this.dirIndex + 1) % 4;
    this.turnedThisTick = true;
    SoundFX.play('turn');
  }

  updateEffects(dt) {
    if (this.activeEffect) {
      this.effectTimer -= dt;
      if (this.effectTimer <= 0) {
        this.activeEffect = null;
        this.effectTimer = 0;
      }
    }
  }

  // Simple lookahead AI logic for relative controls
  updateAI() {
    const head = this.body[0];
    
    // Evaluate 3 choices: straight (0), left (-1), right (1)
    const choices = [
      { name: 'straight', dir: this.dirIndex, score: 0 },
      { name: 'left', dir: (this.dirIndex + 3) % 4, score: 0 },
      { name: 'right', dir: (this.dirIndex + 1) % 4, score: 0 }
    ];
    
    const isCellSafe = (x, y) => {
      let tx = x;
      let ty = y;
      
      if (this.game.bordersWrap) {
        tx = (tx + GRID_SIZE) % GRID_SIZE;
        ty = (ty + GRID_SIZE) % GRID_SIZE;
      } else {
        if (tx < 0 || tx >= GRID_SIZE || ty < 0 || ty >= GRID_SIZE) {
          return false;
        }
      }
      
      // Warp coordinates through portals if portals are active for AI lookahead
      if (this.game.portalsEnabled && (!this.portalCooldown || this.portalCooldown <= 0)) {
        if (tx === 10 && ty === 20) {
          tx = 30;
          ty = 20;
        } else if (tx === 30 && ty === 20) {
          tx = 10;
          ty = 20;
        }
      }
      
      // Check solid obstacles
      if (this.game.obstacles.has(`${tx},${ty}`)) {
        return false;
      }
      
      // Check snakes body parts
      for (let s of this.game.snakes) {
        if (!s.alive) continue;
        for (let seg of s.body) {
          if (seg.x === tx && seg.y === ty) {
            return false;
          }
        }
      }
      return true;
    };
    
    // Filter currently safe choices
    const safeChoices = [];
    for (let choice of choices) {
      const offset = DIRECTIONS[choice.dir];
      const nextX = head.x + offset.x;
      const nextY = head.y + offset.y;
      if (isCellSafe(nextX, nextY)) {
        safeChoices.push(choice);
      }
    }
    
    // If no safe choices, let the standard handler execute to die gracefully
    if (safeChoices.length === 0) {
      return;
    }
    
    // Easy and Medium difficulty random factors
    const diff = this.game.aiDifficulty || 'medium';
    const rand = Math.random();
    let forceRandomSafeMove = false;
    
    if (diff === 'easy' && rand < 0.45) {
      forceRandomSafeMove = true;
    } else if (diff === 'medium' && rand < 0.15) {
      forceRandomSafeMove = true;
    }
    
    if (forceRandomSafeMove) {
      const randomChoice = safeChoices[Math.floor(Math.random() * safeChoices.length)];
      if (randomChoice.name === 'left') {
        this.turnLeft();
      } else if (randomChoice.name === 'right') {
        this.turnRight();
      }
      return;
    }
    
    // Find target fruit using Utility: points / (distance + 1)
    // On Easy difficulty, boti ignore point values and just target the closest fruit (plain distance)
    let targetFruit = null;
    if (diff === 'easy') {
      let minDistance = Infinity;
      for (let f of this.game.fruits) {
        const d = Math.abs(head.x - f.x) + Math.abs(head.y - f.y);
        if (d < minDistance) {
          minDistance = d;
          targetFruit = f;
        }
      }
    } else {
      let maxUtility = -Infinity;
      for (let f of this.game.fruits) {
        const d = Math.abs(head.x - f.x) + Math.abs(head.y - f.y);
        const utility = f.points / (d + 1);
        if (utility > maxUtility) {
          maxUtility = utility;
          targetFruit = f;
        }
      }
    }
    
    for (let choice of choices) {
      const offset = DIRECTIONS[choice.dir];
      const nextX = head.x + offset.x;
      const nextY = head.y + offset.y;
      
      if (!isCellSafe(nextX, nextY)) {
        choice.score = -10000;
        continue;
      }
      
      let tx = nextX;
      let ty = nextY;
      if (this.game.bordersWrap) {
        tx = (tx + GRID_SIZE) % GRID_SIZE;
        ty = (ty + GRID_SIZE) % GRID_SIZE;
      }
      
      // Lookahead step 2: exits from next position
      // Easy difficulty ignores step 2 lookahead entirely to make more mistakes
      let safeExits = 0;
      if (diff !== 'easy') {
        const subDirections = [choice.dir, (choice.dir + 3) % 4, (choice.dir + 1) % 4];
        for (let d2 of subDirections) {
          const offset2 = DIRECTIONS[d2];
          if (isCellSafe(tx + offset2.x, ty + offset2.y)) {
            safeExits++;
          }
        }
      } else {
        safeExits = 1; // dummy value
      }
      
      choice.score = safeExits * 100;
      
      // High reward if this choice directly eats a fruit!
      for (let f of this.game.fruits) {
        if (tx === f.x && ty === f.y) {
          const eatMultiplier = diff === 'easy' ? 15 : 50;
          choice.score += f.points * eatMultiplier;
        }
      }
      
      // Distance to target fruit reward
      if (targetFruit) {
        const fDist = Math.abs(tx - targetFruit.x) + Math.abs(ty - targetFruit.y);
        const distPenalty = diff === 'easy' ? 2 : 5;
        choice.score -= fDist * distPenalty;
      }
      
      // Minor reward to go straight to avoid chaotic movements
      if (choice.name === 'straight') {
        choice.score += 5;
      }
    }
    
    // Sort by score
    choices.sort((a, b) => b.score - a.score);
    
    // Execute choice
    if (choices[0].score > -5000) {
      if (choices[0].name === 'left') {
        this.turnLeft();
      } else if (choices[0].name === 'right') {
        this.turnRight();
      }
    }
  }
}

// ----------------------------------------------------
// 5. GAME ENGINE
// ----------------------------------------------------
const Game = {
  state: 'LOBBY', // LOBBY, PLAYING, PAUSED, GAME_OVER
  
  // Game settings
  mapType: 'classic',
  bordersWrap: true,
  gameSpeed: 'normal', // slow, normal, fast
  aiDifficulty: 'medium', // easy, medium, hard
  graphicsTheme: 'neon', // neon, retro
  portalsEnabled: false, // Portals enabled state
  
  // Custom Obstacles (saved in localStorage)
  customObstacles: new Set(),
  editorTool: 'draw',
  
  // Entities
  snakes: [],
  fruits: [],
  particles: [],
  obstacles: new Set(),
  
  // Player settings (filled during lobby interaction)
  lobbyPlayers: [
    { active: true,  isBot: false, leftKey: 'ArrowLeft', rightKey: 'ArrowRight', name: null },
    { active: true,  isBot: false, leftKey: 'KeyA',      rightKey: 'KeyD',      name: null },
    { active: false, isBot: true,  leftKey: 'KeyJ',      rightKey: 'KeyL',      name: null },
    { active: false, isBot: true,  leftKey: 'KeyF',      rightKey: 'KeyG',      name: null },
    { active: false, isBot: true,  leftKey: 'KeyV',      rightKey: 'KeyB',      name: null },
    { active: false, isBot: true,  leftKey: 'KeyI',      rightKey: 'KeyP',      name: null },
    { active: false, isBot: true,  leftKey: 'KeyZ',      rightKey: 'KeyX',      name: null },
    { active: false, isBot: true,  leftKey: 'KeyN',      rightKey: 'KeyM',      name: null }
  ],
  
  // Key binding state
  bindingPlayerIndex: null,
  bindingKeyType: null, // 'left' or 'right'
  
  // Timer trackers
  lastFrameTime: 0,
  
  // Sound enabled
  soundEnabled: true,
  
  // Canvas drawing reference
  canvas: null,
  ctx: null,
  
  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Load custom obstacles from localStorage
    const savedMap = localStorage.getItem('had_custom_map');
    if (savedMap) {
      try {
        this.customObstacles = new Set(JSON.parse(savedMap));
      } catch(e) {
        this.customObstacles = new Set();
      }
    } else {
      this.customObstacles = new Set();
    }
    
    // UI elements setup
    this.setupLobbyUI();
    this.setupEventListeners();
  },
  
  setupLobbyUI() {
    const gridContainer = document.getElementById('lobby-players-grid');
    gridContainer.innerHTML = '';
    
    this.lobbyPlayers.forEach((lp, idx) => {
      const config = PLAYER_CONFIGS[idx];
      const card = document.createElement('div');
      card.className = `player-card ${lp.active ? 'active-player' : 'inactive-player'}`;
      card.style.setProperty('--player-color', config.color);
      card.style.setProperty('--player-color-rgb', config.rgb);
      card.id = `player-card-${idx}`;
      
      const friendlyLeft = this.getFriendlyKeyName(lp.leftKey);
      const friendlyRight = this.getFriendlyKeyName(lp.rightKey);
      
      card.innerHTML = `
        <div class="player-card-header">
          <div class="player-card-title">
            <span class="player-indicator"></span>
            <input type="text" class="player-name-input" value="${lp.name !== null ? lp.name : (lp.isBot ? 'BOT ' + config.name : config.name)}" onchange="Game.updatePlayerName(${idx}, this.value)" maxLength="12" style="--player-color: ${config.color};" ${lp.active && !lp.isBot ? '' : 'disabled'} />
          </div>
          <button class="player-type-toggle" onclick="Game.togglePlayerType(${idx})">
            ${lp.active ? (lp.isBot ? 'AI BOT' : 'HRÁČ') : 'VYPNUTO'}
          </button>
        </div>
        
        <div class="player-controls-setup" style="display: ${lp.active && !lp.isBot ? 'grid' : 'none'};">
          <div>
            <span class="key-bind-label">Doleva</span>
            <button class="key-bind-btn" id="p${idx}-left-bind" onclick="Game.startKeyBind(${idx}, 'left')">
              ${friendlyLeft}
            </button>
          </div>
          <div>
            <span class="key-bind-label">Doprava</span>
            <button class="key-bind-btn" id="p${idx}-right-bind" onclick="Game.startKeyBind(${idx}, 'right')">
              ${friendlyRight}
            </button>
          </div>
        </div>
      `;
      gridContainer.appendChild(card);
    });
  },
  
  updatePlayerName(idx, value) {
    this.lobbyPlayers[idx].name = value.trim() || null;
  },
  
  saveToHallOfFame(name, score) {
    if (score <= 0) return;
    const saved = localStorage.getItem('had_hall_of_fame');
    let list = [];
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch(e) {
        list = [];
      }
    }
    
    const entry = {
      name: name,
      score: score,
      map: this.mapType === 'classic' ? 'Klasická' : (this.mapType === 'box' ? 'Krabice' : (this.mapType === 'maze' ? 'Bludiště' : 'Vlastní')),
      speed: this.gameSpeed === 'slow' ? 'Pomalá' : (this.gameSpeed === 'fast' ? 'Rychlá' : 'Střední'),
      date: new Date().toLocaleDateString('cs-CZ')
    };
    
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 10);
    localStorage.setItem('had_hall_of_fame', JSON.stringify(list));
  },
  
  renderHallOfFame() {
    const body = document.getElementById('fame-list-body');
    body.innerHTML = '';
    const saved = localStorage.getItem('had_hall_of_fame');
    let list = [];
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch(e) {
        list = [];
      }
    }
    
    if (list.length === 0) {
      body.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 20px;">Žádné záznamy. Odehrajte hru a zapište se do Síně slávy!</td></tr>`;
      return;
    }
    
    list.forEach((entry, idx) => {
      const row = document.createElement('tr');
      row.className = `fame-row-${idx+1}`;
      row.innerHTML = `
        <td>${idx + 1}</td>
        <td style="font-weight: 600;">${entry.name}</td>
        <td style="font-family: var(--font-title); font-weight: bold; color: var(--neon-cyan);">${entry.score}</td>
        <td style="font-size: 0.75rem; color: var(--text-secondary);">${entry.map} / ${entry.speed}</td>
        <td style="font-size: 0.75rem; color: var(--text-secondary);">${entry.date}</td>
      `;
      body.appendChild(row);
    });
  },
  
  initEditor() {
    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    
    this.editorObstacles = new Set(this.customObstacles);
    this.editorTool = 'draw';
    
    document.querySelectorAll('#editor-tool-group .btn-option').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tool === this.editorTool) btn.classList.add('active');
    });
    
    const drawEditorGrid = () => {
      ctx.fillStyle = '#020308';
      ctx.fillRect(0, 0, 500, 500);
      
      const gridCells = 40;
      const cellSize = 500 / gridCells;
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridCells; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, 500);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(500, i * cellSize);
        ctx.stroke();
      }
      
      // Draw obstacles
      ctx.fillStyle = '#00f2fe';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#00f2fe';
      this.editorObstacles.forEach(coord => {
        const [x, y] = coord.split(',').map(Number);
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
      });
      ctx.shadowBlur = 0;
      
      // Draw spawns
      ctx.fillStyle = 'rgba(57, 255, 20, 0.2)';
      SPAWN_POINTS.forEach((pt, i) => {
        ctx.beginPath();
        ctx.arc(pt.x * cellSize + cellSize/2, pt.y * cellSize + cellSize/2, cellSize/2 + 2, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`P${i+1}`, pt.x * cellSize + cellSize/2, pt.y * cellSize + cellSize/2);
      });
      
      // Draw portals
      if (this.portalsEnabled) {
        ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
        ctx.beginPath();
        ctx.arc(10 * cellSize + cellSize/2, 20 * cellSize + cellSize/2, cellSize/2 + 2, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 108, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(30 * cellSize + cellSize/2, 20 * cellSize + cellSize/2, cellSize/2 + 2, 0, Math.PI*2);
        ctx.fill();
      }
    };
    
    let isDrawing = false;
    
    const handleMouseEvent = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      const gx = Math.floor(mx / (rect.width / 40));
      const gy = Math.floor(my / (rect.height / 40));
      
      if (gx >= 0 && gx < 40 && gy >= 0 && gy < 40) {
        const coord = `${gx},${gy}`;
        
        const onSpawn = SPAWN_POINTS.some(pt => pt.x === gx && pt.y === gy);
        const onPortal = this.portalsEnabled && ((gx === 10 && gy === 20) || (gx === 30 && gy === 20));
        
        if (onSpawn || onPortal) return;
        
        if (this.editorTool === 'draw') {
          this.editorObstacles.add(coord);
        } else {
          this.editorObstacles.delete(coord);
        }
        drawEditorGrid();
      }
    };
    
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    
    newCanvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      handleMouseEvent(e);
    });
    
    newCanvas.addEventListener('mousemove', (e) => {
      if (isDrawing) handleMouseEvent(e);
    });
    
    window.addEventListener('mouseup', () => {
      isDrawing = false;
    });
    
    drawEditorGrid();
  },
  
  togglePlayerType(index) {
    const lp = this.lobbyPlayers[index];
    
    // States rotation: Active Human -> Active AI -> Disabled -> Active Human
    if (lp.active && !lp.isBot) {
      lp.isBot = true;
    } else if (lp.active && lp.isBot) {
      lp.active = false;
    } else {
      lp.active = true;
      lp.isBot = false;
    }
    
    this.setupLobbyUI();
  },
  
  startKeyBind(playerIdx, type) {
    // If already binding, reset the previous one
    this.cancelActiveKeyBind();
    
    this.bindingPlayerIndex = playerIdx;
    this.bindingKeyType = type;
    
    const btn = document.getElementById(`p${playerIdx}-${type}-bind`);
    if (btn) {
      btn.innerText = 'Stiskni...';
      btn.classList.add('waiting');
    }
  },
  
  cancelActiveKeyBind() {
    if (this.bindingPlayerIndex !== null) {
      const prevIdx = this.bindingPlayerIndex;
      const prevType = this.bindingKeyType;
      this.bindingPlayerIndex = null;
      this.bindingKeyType = null;
      
      const lp = this.lobbyPlayers[prevIdx];
      const btn = document.getElementById(`p${prevIdx}-${prevType}-bind`);
      if (btn) {
        btn.classList.remove('waiting');
        btn.innerText = this.getFriendlyKeyName(prevType === 'left' ? lp.leftKey : lp.rightKey);
      }
    }
  },
  
  getFriendlyKeyName(code) {
    if (!code) return 'NONE';
    if (code.startsWith('Key')) return code.substring(3);
    if (code.startsWith('Digit')) return code.substring(5);
    if (code.startsWith('Numpad')) return 'Num ' + code.substring(6);
    switch(code) {
      case 'ArrowLeft': return '←';
      case 'ArrowRight': return '→';
      case 'ArrowUp': return '↑';
      case 'ArrowDown': return '↓';
      case 'Space': return 'Mezera';
      case 'ControlLeft': return 'L-Ctrl';
      case 'ControlRight': return 'R-Ctrl';
      case 'ShiftLeft': return 'L-Shift';
      case 'ShiftRight': return 'R-Shift';
      case 'AltLeft': return 'L-Alt';
      case 'AltRight': return 'R-Alt';
      default: return code;
    }
  },
  
  setupEventListeners() {
    // Keyboard inputs for key binding and gameplay turns
    window.addEventListener('keydown', (e) => {
      // 1. Key binding active
      if (this.bindingPlayerIndex !== null) {
        e.preventDefault();
        const playerIdx = this.bindingPlayerIndex;
        const type = this.bindingKeyType;
        
        // Prevent using Escape or Space to bind keys (Escape exits, Space pauses)
        if (e.code === 'Escape' || e.code === 'Space') {
          this.cancelActiveKeyBind();
          return;
        }
        
        // Set new key bind
        if (type === 'left') {
          this.lobbyPlayers[playerIdx].leftKey = e.code;
        } else {
          this.lobbyPlayers[playerIdx].rightKey = e.code;
        }
        
        this.bindingPlayerIndex = null;
        this.bindingKeyType = null;
        this.setupLobbyUI();
        return;
      }
      
      // 2. Pause toggle
      if ((e.code === 'Space' || e.code === 'Escape') && this.state === 'PLAYING') {
        e.preventDefault();
        this.pauseGame();
        return;
      }
      if ((e.code === 'Space' || e.code === 'Escape') && this.state === 'PAUSED') {
        e.preventDefault();
        this.resumeGame();
        return;
      }
      
      // 3. Gameplay snake controls
      if (this.state === 'PLAYING') {
        this.snakes.forEach(snake => {
          if (!snake.alive || snake.isBot) return;
          
          if (e.code === snake.leftKey) {
            e.preventDefault();
            snake.turnLeft();
          } else if (e.code === snake.rightKey) {
            e.preventDefault();
            snake.turnRight();
          }
        });
      }
    });
    
    // Map selection
    document.querySelectorAll('#map-select-group .btn-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#map-select-group .btn-option').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.mapType = e.target.dataset.value;
      });
    });
    
    // Borders wrapping selection
    document.querySelectorAll('#borders-select-group .btn-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#borders-select-group .btn-option').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.bordersWrap = e.target.dataset.value === 'wrap';
      });
    });
    
    // Speed selection
    document.querySelectorAll('#speed-select-group .btn-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#speed-select-group .btn-option').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.gameSpeed = e.target.dataset.value;
      });
    });
    
    // Theme/graphics selection
    document.querySelectorAll('#theme-select-group .btn-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#theme-select-group .btn-option').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.graphicsTheme = e.target.dataset.value;
      });
    });
    
    // AI difficulty selection
    document.querySelectorAll('#ai-diff-select-group .btn-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#ai-diff-select-group .btn-option').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.aiDifficulty = e.target.dataset.value;
      });
    });
    
    // Portals selection
    document.querySelectorAll('#portals-select-group .btn-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#portals-select-group .btn-option').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.portalsEnabled = e.target.dataset.value === 'true';
      });
    });
    
    // Open Custom Map Editor
    document.getElementById('open-editor-btn').addEventListener('click', () => {
      document.getElementById('editor-modal').classList.add('active');
      this.initEditor();
    });
    
    // Editor controls
    document.getElementById('clear-editor-btn').addEventListener('click', () => {
      this.editorObstacles.clear();
      this.initEditor();
    });
    
    document.getElementById('close-editor-btn').addEventListener('click', () => {
      document.getElementById('editor-modal').classList.remove('active');
    });
    
    document.getElementById('save-editor-btn').addEventListener('click', () => {
      this.customObstacles = new Set(this.editorObstacles);
      localStorage.setItem('had_custom_map', JSON.stringify(Array.from(this.customObstacles)));
      document.getElementById('editor-modal').classList.remove('active');
      
      // Auto select the custom map option in Lobby
      document.querySelectorAll('#map-select-group .btn-option').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#map-select-group .btn-option').forEach(b => {
        if (b.dataset.value === 'custom') b.classList.add('active');
      });
      this.mapType = 'custom';
    });
    
    document.querySelectorAll('#editor-tool-group .btn-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#editor-tool-group .btn-option').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.editorTool = e.target.dataset.tool;
      });
    });
    
    // Hall of Fame controls
    const fameModal = document.getElementById('fame-modal');
    document.getElementById('fame-toggle-btn').addEventListener('click', () => {
      fameModal.classList.add('active');
      this.renderHallOfFame();
    });
    
    document.getElementById('close-fame-btn').addEventListener('click', () => {
      fameModal.classList.remove('active');
    });
    
    document.getElementById('clear-fame-btn').addEventListener('click', () => {
      if (confirm('Opravdu chcete vymazat síň slávy?')) {
        localStorage.removeItem('had_hall_of_fame');
        this.renderHallOfFame();
      }
    });
    
    // Lobby launcher
    document.getElementById('start-game-btn').addEventListener('click', () => {
      this.initGame();
    });
    
    // Play overlay control buttons
    document.getElementById('resume-game-btn').addEventListener('click', () => this.resumeGame());
    document.getElementById('abort-game-btn').addEventListener('click', () => this.abortGame());
    
    // GameOver control buttons
    document.getElementById('restart-game-btn').addEventListener('click', () => this.initGame());
    document.getElementById('return-lobby-btn').addEventListener('click', () => this.showScreen('lobby-screen'));
  },
  
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if (screenId === 'lobby-screen') {
      this.state = 'LOBBY';
    } else if (screenId === 'play-screen') {
      this.state = 'PLAYING';
    } else if (screenId === 'gameover-screen') {
      this.state = 'GAME_OVER';
    }
  },
  
  // ----------------------------------------------------
  // GAMEPLAY FLOW
// ----------------------------------------------------
  initGame() {
    this.cancelActiveKeyBind();
    
    // Generate static map obstacles
    this.obstacles = this.generateObstacles(this.mapType, GRID_SIZE, GRID_SIZE);
    
    // Construct players
    this.snakes = [];
    let spawnIndex = 0;
    
    this.lobbyPlayers.forEach((lp, idx) => {
      if (!lp.active) return;
      
      const config = PLAYER_CONFIGS[idx];
      const spawn = SPAWN_POINTS[spawnIndex % SPAWN_POINTS.length];
      spawnIndex++;
      
      // Override default configurations with the ones bound in the lobby
      const snakeConfig = {
        ...config,
        name: lp.name || (lp.isBot ? `BOT ${config.name}` : config.name),
        leftKey: lp.leftKey,
        rightKey: lp.rightKey
      };
      
      const snake = new Snake(this, snakeConfig, spawn);
      snake.isBot = lp.isBot;
      this.snakes.push(snake);
    });
    
    // Clear out obstacles that overlap with starting snake segments
    this.snakes.forEach(snake => {
      snake.body.forEach(seg => {
        this.obstacles.delete(`${seg.x},${seg.y}`);
      });
    });
    
    // Clear out obstacles at portal positions
    if (this.portalsEnabled) {
      this.obstacles.delete('10,20');
      this.obstacles.delete('30,20');
    }
    
    // Make sure we have at least one snake active
    if (this.snakes.length === 0) {
      alert('Aktivujte prosím alespoň jednoho hráče nebo AI bota!');
      return;
    }
    
    // Clean up entities
    this.fruits = [];
    this.particles = [];
    
    // Spawn initial fruits. More players -> more fruits.
    const fruitCount = Math.max(2, this.snakes.length);
    for (let i = 0; i < fruitCount; i++) {
      this.spawnFruit();
    }
    
    // Set speed intervals
    // Base moving intervals in milliseconds
    let speedMs = 120;
    if (this.gameSpeed === 'slow') speedMs = 180;
    if (this.gameSpeed === 'fast') speedMs = 80;
    this.baseInterval = speedMs;
    
    // UI components updates
    this.updateScoreboardUI();
    document.getElementById('pause-overlay').classList.remove('active');
    
    this.showScreen('play-screen');
    
    // Init game loop
    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  },
  
  generateObstacles(type, w, h) {
    const obstacles = new Set();
    if (type === 'classic') return obstacles;
    if (type === 'custom') {
      return new Set(this.customObstacles);
    }
    
    if (type === 'box') {
      const mid = Math.floor(w / 2);
      // Rectangular box with central openings
      for (let x = 8; x <= w - 9; x++) {
        if (Math.abs(x - mid) > 3) {
          obstacles.add(`${x},8`);
          obstacles.add(`${x},${h - 9}`);
        }
      }
      for (let y = 8; y <= h - 9; y++) {
        if (Math.abs(y - mid) > 3) {
          obstacles.add(`8,${y}`);
          obstacles.add(`${w - 9},${y}`);
        }
      }
    } else if (type === 'maze') {
      // Four corner blocks
      const centerPoints = [
        {x: 8, y: 8}, {x: 8, y: 31}, {x: 31, y: 8}, {x: 31, y: 31}
      ];
      for (let cp of centerPoints) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            obstacles.add(`${cp.x + dx},${cp.y + dy}`);
          }
        }
      }
      
      // Central symmetric walls
      const mid = Math.floor(w / 2);
      for (let i = 0; i < 6; i++) {
        obstacles.add(`${mid},${mid - 7 + i}`);
        obstacles.add(`${mid},${mid + 2 + i}`);
        obstacles.add(`${mid - 7 + i},${mid}`);
        obstacles.add(`${mid + 2 + i},${mid}`);
      }
    }
    
    return obstacles;
  },
  
  spawnFruit() {
    let attempts = 0;
    while(attempts < 500) {
      attempts++;
      const fx = Math.floor(Math.random() * GRID_SIZE);
      const fy = Math.floor(Math.random() * GRID_SIZE);
      
      // Overlap checks
      if (this.obstacles.has(`${fx},${fy}`)) continue;
      
      let hit = false;
      for (let s of this.snakes) {
        if (!s.alive) continue;
        for (let seg of s.body) {
          if (seg.x === fx && seg.y === fy) {
            hit = true;
            break;
          }
        }
        if (hit) break;
      }
      if (hit) continue;
      
      // Check existing fruits
      for (let f of this.fruits) {
        if (f.x === fx && f.y === fy) {
          hit = true;
          break;
        }
      }
      if (hit) continue;
      
      // Deciding Fruit Type based on probability
      const r = Math.random();
      let type = FRUIT_TYPES.NORMAL;
      if (r < 0.1) {
        type = FRUIT_TYPES.GOLDEN;
      } else if (r < 0.2) {
        type = FRUIT_TYPES.CHILI;
      } else if (r < 0.3) {
        type = FRUIT_TYPES.BERRY;
      }
      
      this.fruits.push({ x: fx, y: fy, ...type });
      return;
    }
  },
  
  spawnPortalParticles(fx, fy, tx, ty) {
    const fpx = fx * CELL_SIZE + CELL_SIZE / 2;
    const fpy = fy * CELL_SIZE + CELL_SIZE / 2;
    const tpx = tx * CELL_SIZE + CELL_SIZE / 2;
    const tpy = ty * CELL_SIZE + CELL_SIZE / 2;
    
    for (let i = 0; i < 12; i++) {
      this.particles.push(new Particle(fpx, fpy, '#00f2fe')); // Blue portal
      this.particles.push(new Particle(tpx, tpy, '#ff6c00')); // Orange portal
    }
  },
  
  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    document.getElementById('pause-overlay').classList.add('active');
  },
  
  resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    document.getElementById('pause-overlay').classList.remove('active');
    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  },
  
  abortGame() {
    this.showScreen('lobby-screen');
  },
  
  // Main time-accumulating frame loop
  gameLoop(time) {
    if (this.state !== 'PLAYING') return;
    
    const dt = time - this.lastFrameTime;
    this.lastFrameTime = time;
    
    // Protect against huge dt values on tab suspension
    const activeDt = Math.min(dt, 100);
    const dtRatio = activeDt / 16.666; // Base calculations relative to 60fps
    
    // Update individual snakes based on speed modifiers
    this.snakes.forEach(snake => {
      if (!snake.alive) return;
      
      // Update durations for active power-ups
      snake.updateEffects(activeDt);
      
      // Determine movement speed coefficient
      let speedCoeff = 1.0;
      if (snake.activeEffect === 'boost') {
        speedCoeff = 0.6; // Moves faster (less interval)
      } else if (snake.activeEffect === 'slow') {
        speedCoeff = 1.5; // Moves slower (more interval)
      }
      
      const currentInterval = this.baseInterval * speedCoeff;
      
      snake.timeAccumulator += activeDt;
      if (snake.timeAccumulator >= currentInterval) {
        snake.timeAccumulator -= currentInterval;
        
        // AI snake decisions
        if (snake.isBot) {
          snake.updateAI();
        }
        
        // Take a step
        this.moveSnake(snake);
        
        // Flush key buffering flags
        snake.turnedThisTick = false;
        if (snake.pendingTurn !== null) {
          if (snake.pendingTurn === -1) {
            snake.dirIndex = (snake.dirIndex + 3) % 4;
          } else {
            snake.dirIndex = (snake.dirIndex + 1) % 4;
          }
          snake.pendingTurn = null;
          snake.turnedThisTick = true;
        }
      }
    });
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dtRatio);
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // Render frame
    this.draw();
    
    // Check match ending conditions
    this.checkGameStatus();
    
    if (this.state === 'PLAYING') {
      requestAnimationFrame((t) => this.gameLoop(t));
    }
  },
  
  moveSnake(snake) {
    const head = snake.body[0];
    const offset = DIRECTIONS[snake.dirIndex];
    let nextX = head.x + offset.x;
    let nextY = head.y + offset.y;
    
    // Wrap around vs Solid wall checks
    if (this.bordersWrap) {
      nextX = (nextX + GRID_SIZE) % GRID_SIZE;
      nextY = (nextY + GRID_SIZE) % GRID_SIZE;
    } else {
      if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
        this.killSnake(snake, 'Náraz do okraje arény!');
        return;
      }
    }
    
    // Portal teleportation logic
    if (this.portalsEnabled) {
      if (!snake.portalCooldown) snake.portalCooldown = 0;
      
      if (snake.portalCooldown > 0) {
        snake.portalCooldown--;
      } else {
        if (nextX === 10 && nextY === 20) {
          nextX = 30;
          nextY = 20;
          snake.portalCooldown = 2; // cooldown for 2 ticks
          SoundFX.play('teleport');
          this.spawnPortalParticles(10, 20, 30, 20);
        } else if (nextX === 30 && nextY === 20) {
          nextX = 10;
          nextY = 20;
          snake.portalCooldown = 2;
          SoundFX.play('teleport');
          this.spawnPortalParticles(30, 20, 10, 20);
        }
      }
    }
    
    // Obstacle crash
    if (this.obstacles.has(`${nextX},${nextY}`)) {
      this.killSnake(snake, 'Náraz do překážky!');
      return;
    }
    
    // Other snake / self body crash
    for (let other of this.snakes) {
      if (!other.alive) continue;
      
      for (let seg of other.body) {
        if (seg.x === nextX && seg.y === nextY) {
          this.killSnake(snake, `Kolize s tělem (${other.name})!`);
          return;
        }
      }
    }
    
    // Insert new head
    const newHead = { x: nextX, y: nextY };
    snake.body.unshift(newHead);
    
    // Check fruit consumption
    let eatenIndex = -1;
    for (let i = 0; i < this.fruits.length; i++) {
      const f = this.fruits[i];
      if (f.x === nextX && f.y === nextY) {
        eatenIndex = i;
        break;
      }
    }
    
    if (eatenIndex !== -1) {
      const fruit = this.fruits[eatenIndex];
      this.fruits.splice(eatenIndex, 1);
      
      // Grow and score points
      snake.score += fruit.points;
      
      // Spawning growth sections (minus 1 because head is already unshifted)
      const extraGrow = fruit.grow - 1;
      for (let g = 0; g < extraGrow; g++) {
        // Just duplicate the tail segment
        const tail = snake.body[snake.body.length - 1];
        snake.body.push({ x: tail.x, y: tail.y });
      }
      
      // Apply power-up modifiers
      if (fruit.effect) {
        snake.activeEffect = fruit.effect;
        snake.effectTimer = fruit.duration;
      }
      
      // Sounds & explosion particles
      SoundFX.play('eat');
      const px = nextX * CELL_SIZE + CELL_SIZE / 2;
      const py = nextY * CELL_SIZE + CELL_SIZE / 2;
      for (let pCount = 0; pCount < 15; pCount++) {
        this.particles.push(new Particle(px, py, fruit.color));
      }
      
      // Update UI panels
      this.updateScoreboardUI();
      
      // Spawn replacements
      this.spawnFruit();
    } else {
      // Normal walk, remove tail segment
      snake.body.pop();
    }
  },
  
  killSnake(snake, reason) {
    snake.alive = false;
    SoundFX.play('death');
    
    // Trigger body explosions
    snake.body.forEach(seg => {
      const px = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const py = seg.y * CELL_SIZE + CELL_SIZE / 2;
      for (let pCount = 0; pCount < 5; pCount++) {
        this.particles.push(new Particle(px, py, snake.color));
      }
    });
    
    snake.body = []; // Clear segments
    this.updateScoreboardUI();
  },
  
  checkGameStatus() {
    const aliveSnakes = this.snakes.filter(s => s.alive);
    
    // If only one player is configured (Single Player vs AI, or just one Human)
    const activeCount = this.snakes.length;
    
    if (activeCount === 1) {
      // Single player game: ends when player dies
      if (aliveSnakes.length === 0) {
        this.endGame();
      }
    } else {
      // Multiplayer game: ends when 1 or 0 snakes remain
      if (aliveSnakes.length <= 1) {
        this.endGame();
      }
    }
  },
  
  endGame() {
    this.state = 'GAME_OVER';
    SoundFX.play('win');
    
    // Rank players by score
    const sorted = [...this.snakes].sort((a, b) => b.score - a.score);
    
    // Save human players score to the Hall of Fame
    this.snakes.forEach(snake => {
      if (!snake.isBot) {
        this.saveToHallOfFame(snake.name, snake.score);
      }
    });
    
    // Announce winner (always the one with the highest score)
    const winnerAnn = document.getElementById('winner-announcement');
    winnerAnn.innerText = `VÍTĚZ: ${sorted[0].name} (${sorted[0].score} bodů)`;
    winnerAnn.style.color = sorted[0].color;
    
    // Leaderboard generation
    const lbList = document.getElementById('gameover-leaderboard-list');
    lbList.innerHTML = '';
    
    sorted.forEach((snake, rank) => {
      const row = document.createElement('div');
      row.className = `leaderboard-row rank-${rank + 1}`;
      row.style.setProperty('--player-color', snake.color);
      
      row.innerHTML = `
        <div class="rank-badge">${rank + 1}</div>
        <div class="leaderboard-player">
          <span class="leaderboard-color"></span>
          <span>${snake.name}</span>
        </div>
        <div class="leaderboard-score">${snake.score} bodů</div>
      `;
      lbList.appendChild(row);
    });
    
    this.showScreen('gameover-screen');
  },
  
  // Update in-game sidebar scoreboard
  updateScoreboardUI() {
    const scoreContainer = document.getElementById('score-items-container');
    scoreContainer.innerHTML = '';
    
    // Order scoreboard by score
    const sorted = [...this.snakes].sort((a, b) => b.score - a.score);
    
    sorted.forEach(snake => {
      const friendlyLeft = this.getFriendlyKeyName(snake.leftKey);
      const friendlyRight = this.getFriendlyKeyName(snake.rightKey);
      
      const card = document.createElement('div');
      card.className = `score-card ${snake.alive ? '' : 'eliminated'}`;
      card.style.setProperty('--player-color', snake.color);
      card.style.setProperty('--player-color-rgb', snake.rgb);
      
      let stateBadge = '';
      if (!snake.alive) {
        stateBadge = '<span style="color: var(--neon-red); font-size: 0.65rem; font-weight: bold; border: 1px solid var(--neon-red); padding: 1px 4px; border-radius: 3px;">K.O.</span>';
      } else if (snake.activeEffect === 'boost') {
        stateBadge = '<span style="color: var(--neon-yellow); font-size: 0.65rem; font-weight: bold; border: 1px solid var(--neon-yellow); padding: 1px 4px; border-radius: 3px; animation: pulse-glow 0.5s infinite alternate;">BOOST</span>';
      } else if (snake.activeEffect === 'slow') {
        stateBadge = '<span style="color: var(--neon-blue); font-size: 0.65rem; font-weight: bold; border: 1px solid var(--neon-blue); padding: 1px 4px; border-radius: 3px;">ZPŮM.</span>';
      }
      
      card.innerHTML = `
        <div class="score-player-info">
          <div class="score-player-name" style="display: flex; align-items: center; gap: 8px;">
            <span>${snake.name}</span>
            ${stateBadge}
          </div>
          ${!snake.isBot ? `<div class="score-player-keys">ovl: ${friendlyLeft} / ${friendlyRight}</div>` : '<div class="score-player-keys">ovl: AI BOT</div>'}
        </div>
        <div class="score-value">${snake.score}</div>
      `;
      scoreContainer.appendChild(card);
    });
  },
  
  // ----------------------------------------------------
  // CANVAS RENDERING
  // ----------------------------------------------------
  draw() {
    const isRetro = this.graphicsTheme === 'retro';
    
    // 1. Draw Background
    if (isRetro) {
      // Dark forest grass/mud color
      this.ctx.fillStyle = '#182b1c';
      this.ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      // Draw pixelated grid pattern
      this.ctx.fillStyle = '#122216';
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          if ((x + y) % 2 === 0) {
            this.ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
      }
      // Faint retro pixelated dots/tufts
      this.ctx.fillStyle = '#1e3824';
      for (let x = 2; x < GRID_SIZE; x += 5) {
        for (let y = 3; y < GRID_SIZE; y += 7) {
          const px = x * CELL_SIZE + CELL_SIZE / 2;
          const py = y * CELL_SIZE + CELL_SIZE / 2;
          // small pixel grass tuft
          this.ctx.fillRect(px - 2, py, 4, 2);
          this.ctx.fillRect(px, py - 2, 2, 4);
        }
      }
    } else {
      // Clear Canvas
      this.ctx.fillStyle = '#03040a';
      this.ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      // Draw neon cybergrid background
      this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
      this.ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_SIZE; x += CELL_SIZE) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, CANVAS_SIZE);
        this.ctx.stroke();
      }
      for (let y = 0; y < CANVAS_SIZE; y += CELL_SIZE) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(CANVAS_SIZE, y);
        this.ctx.stroke();
      }
    }
    
    // 2. Draw map outline
    if (!this.bordersWrap) {
      if (isRetro) {
        // Brown wooden fence border
        this.ctx.fillStyle = '#834c24'; // Wood brown
        this.ctx.fillRect(0, 0, CANVAS_SIZE, 6);
        this.ctx.fillRect(0, CANVAS_SIZE - 6, CANVAS_SIZE, 6);
        this.ctx.fillRect(0, 0, 6, CANVAS_SIZE);
        this.ctx.fillRect(CANVAS_SIZE - 6, 0, 6, CANVAS_SIZE);
      } else {
        this.ctx.strokeStyle = 'rgba(255, 0, 60, 0.4)';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      }
    } else {
      // Draw thin wrapping borders indicator
      this.ctx.save();
      if (isRetro) {
        this.ctx.strokeStyle = 'rgba(45, 90, 39, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(2, 2, CANVAS_SIZE - 4, CANVAS_SIZE - 4);
      } else {
        this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 8]);
        this.ctx.strokeRect(2, 2, CANVAS_SIZE - 4, CANVAS_SIZE - 4);
      }
      this.ctx.restore();
    }
    
    // 3. Draw obstacles
    this.ctx.shadowBlur = 0; // reset shadow
    
    this.obstacles.forEach(coord => {
      const [ox, oy] = coord.split(',').map(Number);
      const px = ox * CELL_SIZE;
      const py = oy * CELL_SIZE;
      
      if (isRetro) {
        // Draw pixel-art tree block
        this.ctx.save();
        // Trunk / Stump base
        this.ctx.fillStyle = '#5c3a21'; // Brown
        this.ctx.fillRect(px + 6, py + 12, 8, 8);
        this.ctx.fillStyle = '#3a2211'; // Shadow trunk
        this.ctx.fillRect(px + 10, py + 12, 4, 8);
        
        // Green foliage
        this.ctx.fillStyle = '#2d5a27'; // Dark green leaves
        this.ctx.fillRect(px + 2, py + 2, 16, 10);
        this.ctx.fillStyle = '#397831'; // Light green highlights
        this.ctx.fillRect(px + 4, py + 4, 6, 4);
        this.ctx.fillStyle = '#1f3e1b'; // Deep shadow leaves
        this.ctx.fillRect(px + 12, py + 6, 4, 4);
        this.ctx.restore();
      } else {
        this.ctx.save();
        this.ctx.fillStyle = '#1c223c';
        this.ctx.strokeStyle = '#00f2fe';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#00f2fe';
        this.ctx.shadowBlur = 8;
        this.ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        this.ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        this.ctx.restore();
      }
    });
    
    // 3.5 Draw portals
    if (this.portalsEnabled) {
      const paX = 10 * CELL_SIZE + CELL_SIZE / 2;
      const paY = 20 * CELL_SIZE + CELL_SIZE / 2;
      const pbX = 30 * CELL_SIZE + CELL_SIZE / 2;
      const pbY = 20 * CELL_SIZE + CELL_SIZE / 2;
      const portalTime = performance.now() * 0.005;
      
      if (isRetro) {
        this.ctx.save();
        // Portal A (Cyan)
        this.ctx.fillStyle = '#0066ff';
        this.ctx.fillRect(10 * CELL_SIZE + 2, 20 * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        this.ctx.fillStyle = '#00f2fe';
        this.ctx.fillRect(10 * CELL_SIZE + 5, 20 * CELL_SIZE + 5, CELL_SIZE - 10, CELL_SIZE - 10);
        
        // Portal B (Orange)
        this.ctx.fillStyle = '#ff6c00';
        this.ctx.fillRect(30 * CELL_SIZE + 2, 20 * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        this.ctx.fillStyle = '#ffe600';
        this.ctx.fillRect(30 * CELL_SIZE + 5, 20 * CELL_SIZE + 5, CELL_SIZE - 10, CELL_SIZE - 10);
        this.ctx.restore();
      } else {
        this.ctx.save();
        this.ctx.lineWidth = 3;
        
        // Portal A (Cyan glow)
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00f2fe';
        this.ctx.strokeStyle = '#00f2fe';
        this.ctx.beginPath();
        this.ctx.arc(paX, paY, CELL_SIZE / 2 + Math.sin(portalTime) * 2, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Portal B (Orange glow)
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#ff6c00';
        this.ctx.strokeStyle = '#ff6c00';
        this.ctx.beginPath();
        this.ctx.arc(pbX, pbY, CELL_SIZE / 2 + Math.cos(portalTime) * 2, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
      }
    }
    
    // 4. Draw fruits
    this.fruits.forEach(fruit => {
      const px = fruit.x * CELL_SIZE;
      const py = fruit.y * CELL_SIZE;
      
      if (isRetro) {
        // Draw 8-bit retro pixel apple
        this.ctx.save();
        // Red fruit body (blocky)
        this.ctx.fillStyle = fruit.color;
        this.ctx.fillRect(px + 4, py + 6, 12, 12);
        this.ctx.fillRect(px + 6, py + 4, 8, 2);
        this.ctx.fillRect(px + 6, py + 18, 8, 1);
        
        // White pixel shine
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(px + 6, py + 6, 2, 2);
        
        // Brown wood stem
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(px + 9, py + 1, 2, 3);
        
        // Green leaf
        this.ctx.fillStyle = '#39ff14';
        this.ctx.fillRect(px + 11, py + 2, 3, 2);
        this.ctx.restore();
      } else {
        this.ctx.save();
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = fruit.shadow;
        this.ctx.fillStyle = fruit.color;
        
        const cx = px + CELL_SIZE / 2;
        const cy = py + CELL_SIZE / 2;
        
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw shiny core
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(cx - 2, cy - 2, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    });
    
    // 5. Draw particles
    this.particles.forEach(p => p.draw(this.ctx));
    
    // 6. Draw snakes
    this.snakes.forEach(snake => {
      if (!snake.alive || snake.body.length === 0) return;
      
      if (isRetro) {
        // Draw 8-bit pixel snake (segmented block textures)
        snake.body.forEach((seg, idx) => {
          const px = seg.x * CELL_SIZE;
          const py = seg.y * CELL_SIZE;
          const isHead = idx === 0;
          
          this.ctx.save();
          // Draw body block
          this.ctx.fillStyle = snake.color;
          let offset = 1;
          if (snake.activeEffect === 'boost') offset = 0;
          if (snake.activeEffect === 'slow') offset = 2;
          
          this.ctx.fillRect(px + offset, py + offset, CELL_SIZE - offset * 2, CELL_SIZE - offset * 2);
          
          // Add scale textures
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'; // Highlight
          this.ctx.fillRect(px + offset + 2, py + offset + 2, 4, 4);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; // Shadow
          this.ctx.fillRect(px + CELL_SIZE - offset - 6, py + CELL_SIZE - offset - 6, 4, 4);
          
          if (isHead) {
            // Draw eyes based on head orientation
            this.ctx.fillStyle = '#ffffff';
            const eyeSize = 4;
            const pupilSize = 2;
            const dir = snake.dirIndex;
            
            let e1x, e1y, e2x, e2y;
            if (dir === 0) { // Up
              e1x = px + 4; e1y = py + 4; e2x = px + 12; e2y = py + 4;
            } else if (dir === 1) { // Right
              e1x = px + 12; e1y = py + 4; e2x = px + 12; e2y = py + 12;
            } else if (dir === 2) { // Down
              e1x = px + 4; e1y = py + 12; e2x = px + 12; e2y = py + 12;
            } else { // Left
              e1x = px + 4; e1y = py + 4; e2x = px + 4; e2y = py + 12;
            }
            
            this.ctx.fillRect(e1x, e1y, eyeSize, eyeSize);
            this.ctx.fillRect(e2x, e2y, eyeSize, eyeSize);
            
            this.ctx.fillStyle = '#000000'; // Pupil
            this.ctx.fillRect(e1x + 1, e1y + 1, pupilSize, pupilSize);
            this.ctx.fillRect(e2x + 1, e2y + 1, pupilSize, pupilSize);
          }
          this.ctx.restore();
        });
      } else {
        // Neon path rendering
        this.ctx.save();
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = snake.color;
        this.ctx.strokeStyle = snake.color;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Apply thicker line for speed boost
        this.ctx.lineWidth = snake.activeEffect === 'boost' ? CELL_SIZE - 2 : CELL_SIZE - 4;
        if (snake.activeEffect === 'slow') {
          this.ctx.lineWidth = CELL_SIZE - 6;
        }
        
        // Draw body path
        this.ctx.beginPath();
        snake.body.forEach((seg, index) => {
          const px = seg.x * CELL_SIZE + CELL_SIZE / 2;
          const py = seg.y * CELL_SIZE + CELL_SIZE / 2;
          
          if (index > 0) {
            const prev = snake.body[index - 1];
            if (Math.abs(seg.x - prev.x) > 1 || Math.abs(seg.y - prev.y) > 1) {
              this.ctx.stroke();
              this.ctx.beginPath();
              this.ctx.moveTo(px, py);
            } else {
              this.ctx.lineTo(px, py);
            }
          } else {
            this.ctx.moveTo(px, py);
          }
        });
        this.ctx.stroke();
        this.ctx.restore();
        
        // Draw special neon snake head
        const head = snake.body[0];
        const hx = head.x * CELL_SIZE + CELL_SIZE / 2;
        const hy = head.y * CELL_SIZE + CELL_SIZE / 2;
        
        this.ctx.save();
        this.ctx.shadowBlur = 18;
        this.ctx.shadowColor = snake.color;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(hx, hy, CELL_SIZE / 2 - 1, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = snake.color;
        this.ctx.beginPath();
        
        const offset = DIRECTIONS[snake.dirIndex];
        const eyeOffset = CELL_SIZE / 4;
        if (offset.x !== 0) {
          this.ctx.arc(hx + offset.x * 2, hy - eyeOffset, 2, 0, Math.PI * 2);
          this.ctx.arc(hx + offset.x * 2, hy + eyeOffset, 2, 0, Math.PI * 2);
        } else {
          this.ctx.arc(hx - eyeOffset, hy + offset.y * 2, 2, 0, Math.PI * 2);
          this.ctx.arc(hx + eyeOffset, hy + offset.y * 2, 2, 0, Math.PI * 2);
        }
        this.ctx.fill();
        this.ctx.restore();
      }
    });
  }
};

// Start application when DOM loaded
window.addEventListener('DOMContentLoaded', () => {
  Game.init();
});

// Expose Game to window so inline HTML event handlers (e.g. onclick="Game.togglePlayerType(...)") function properly
window.Game = Game;
