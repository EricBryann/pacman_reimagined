// ========================================
// AGAR.IO CLONE - Single Player Edition
// ========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const playButton = document.getElementById('play-button');
const restartButton = document.getElementById('restart-button');
const playerNameInput = document.getElementById('player-name');
const scoreDisplay = document.getElementById('score');
const leaderboardList = document.getElementById('leaderboard-list');
const finalScoreDisplay = document.getElementById('final-score');
const survivalTimeDisplay = document.getElementById('survival-time');
const cellsEatenDisplay = document.getElementById('cells-eaten');
const quitBtn = document.getElementById('quit-btn');

// Game Configuration
const CONFIG = {
    WORLD_WIDTH: 2500,
    WORLD_HEIGHT: 2500,
    GRID_SIZE: 50,
    FOOD_COUNT: 250,
    ENEMY_COUNT: 20,
    PLAYER_START_MASS: 10,
    MIN_MASS: 10,
    FOOD_MASS: 1,
    SPEED_FACTOR: 0.0025,
    SPLIT_SPEED_BOOST: 3,
    MASS_DECAY_RATE: 0.0001,
    ZOOM_FACTOR: 0.04,
    EAT_OVERLAP: 0.5,
};

// AI Names for enemies
const AI_NAMES = [
    'Blob Master', 'CellKing', 'Hungry', 'Nomster', 'BigBoi',
    'Destroyer', 'Swift', 'Hunter', 'Predator', 'Stealth',
    'Titan', 'Ghost', 'Phantom', 'Shadow', 'Ninja',
    'Dragon', 'Viper', 'Cobra', 'Eagle', 'Hawk',
    'Thunder', 'Storm', 'Blaze', 'Frost', 'Ice',
    'Chaos', 'Void', 'Nova', 'Cosmic', 'Stellar'
];

// Color palettes for cells
const CELL_COLORS = [
    { main: '#ff6b6b', glow: 'rgba(255, 107, 107, 0.5)' },
    { main: '#4ecdc4', glow: 'rgba(78, 205, 196, 0.5)' },
    { main: '#45b7d1', glow: 'rgba(69, 183, 209, 0.5)' },
    { main: '#96ceb4', glow: 'rgba(150, 206, 180, 0.5)' },
    { main: '#ffeaa7', glow: 'rgba(255, 234, 167, 0.5)' },
    { main: '#dfe6e9', glow: 'rgba(223, 230, 233, 0.5)' },
    { main: '#fd79a8', glow: 'rgba(253, 121, 168, 0.5)' },
    { main: '#a29bfe', glow: 'rgba(162, 155, 254, 0.5)' },
    { main: '#00b894', glow: 'rgba(0, 184, 148, 0.5)' },
    { main: '#e17055', glow: 'rgba(225, 112, 85, 0.5)' },
    { main: '#74b9ff', glow: 'rgba(116, 185, 255, 0.5)' },
    { main: '#ff7675', glow: 'rgba(255, 118, 117, 0.5)' },
    { main: '#55efc4', glow: 'rgba(85, 239, 196, 0.5)' },
    { main: '#fab1a0', glow: 'rgba(250, 177, 160, 0.5)' },
];

// Food colors
const FOOD_COLORS = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#fd79a8', '#a29bfe', '#00b894', '#e17055', '#74b9ff',
    '#55efc4', '#81ecec', '#fab1a0', '#ff9ff3', '#feca57'
];

// Game State
let gameState = {
    running: false,
    player: null,
    enemies: [],
    food: [],
    particles: [],
    camera: { x: 0, y: 0, zoom: 1 },
    mouse: { x: 0, y: 0 },
    startTime: 0,
    cellsEaten: 0,
};

// ========================================
// CLASSES
// ========================================

class Cell {
    constructor(x, y, mass, name, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.name = name;
        this.color = color;
        this.isPlayer = isPlayer;
        this.vx = 0;
        this.vy = 0;
        this.targetX = x;
        this.targetY = y;
    }

    get radius() {
        return Math.sqrt(this.mass) * 4;
    }

    get speed() {
        return Math.max(1, 50 / Math.sqrt(this.mass)) * CONFIG.SPEED_FACTOR;
    }

    update() {
        // Calculate direction to target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
            // Smooth movement with easing
            const speed = this.speed * 60;
            this.vx = (dx / dist) * speed;
            this.vy = (dy / dist) * speed;
        } else {
            this.vx *= 0.9;
            this.vy *= 0.9;
        }

        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;

        // Boundary collision
        this.x = Math.max(this.radius, Math.min(CONFIG.WORLD_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(CONFIG.WORLD_HEIGHT - this.radius, this.y));
    }

    draw(ctx, camera) {
        const screenX = (this.x - camera.x) * camera.zoom + canvas.width / 2;
        const screenY = (this.y - camera.y) * camera.zoom + canvas.height / 2;
        const screenRadius = this.radius * camera.zoom;

        // Skip if off-screen
        if (screenX + screenRadius < 0 || screenX - screenRadius > canvas.width ||
            screenY + screenRadius < 0 || screenY - screenRadius > canvas.height) {
            return;
        }

        // Outer glow
        const gradient = ctx.createRadialGradient(
            screenX, screenY, screenRadius * 0.5,
            screenX, screenY, screenRadius * 1.3
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.7, this.color.glow);
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, screenRadius * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Main body with gradient
        const bodyGradient = ctx.createRadialGradient(
            screenX - screenRadius * 0.3, screenY - screenRadius * 0.3, 0,
            screenX, screenY, screenRadius
        );
        bodyGradient.addColorStop(0, this.lightenColor(this.color.main, 40));
        bodyGradient.addColorStop(0.5, this.color.main);
        bodyGradient.addColorStop(1, this.darkenColor(this.color.main, 20));

        ctx.beginPath();
        ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
        ctx.fillStyle = bodyGradient;
        ctx.fill();

        // Subtle border
        ctx.strokeStyle = this.darkenColor(this.color.main, 30);
        ctx.lineWidth = Math.max(2, screenRadius * 0.05);
        ctx.stroke();

        // Name label
        if (screenRadius > 15) {
            const fontSize = Math.max(12, Math.min(screenRadius * 0.4, 24));
            ctx.font = `bold ${fontSize}px 'Exo 2', sans-serif`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Text shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.fillText(this.name, screenX, screenY);
            ctx.shadowBlur = 0;
        }
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    canEat(other) {
        if (this.mass <= other.mass * 1.1) return false;
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.radius - other.radius * CONFIG.EAT_OVERLAP;
    }
}

class AICell extends Cell {
    constructor(x, y, mass, name, color) {
        super(x, y, mass, name, color, false);
        this.personality = Math.random(); // 0 = aggressive, 1 = passive
        this.decisionTimer = 0;
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.state = 'wander'; // wander, chase, flee
        this.target = null;
    }

    think(player, enemies, food) {
        this.decisionTimer--;
        if (this.decisionTimer > 0) return;

        this.decisionTimer = 30 + Math.random() * 30;

        // Find threats and prey
        let nearestThreat = null;
        let nearestThreatDist = Infinity;
        let nearestPrey = null;
        let nearestPreyDist = Infinity;
        let nearestFood = null;
        let nearestFoodDist = Infinity;
        let canEatPlayer = false;
        let playerDist = Infinity;

        // Check player - PRIORITIZE hunting player if bigger
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            playerDist = Math.sqrt(dx * dx + dy * dy);

            if (player.mass > this.mass * 1.1 && playerDist < this.radius * 8) {
                nearestThreat = player;
                nearestThreatDist = playerDist;
            } else if (this.mass > player.mass * 1.1) {
                // Can eat player - high priority target with large detection range
                canEatPlayer = true;
                nearestPrey = player;
                nearestPreyDist = playerDist;
            }
        }

        // Check other enemies (only if not hunting player)
        if (!canEatPlayer) {
            for (const enemy of enemies) {
                if (enemy === this) continue;
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (enemy.mass > this.mass * 1.1 && dist < nearestThreatDist && dist < this.radius * 8) {
                    nearestThreat = enemy;
                    nearestThreatDist = dist;
                } else if (this.mass > enemy.mass * 1.1 && dist < nearestPreyDist && dist < this.radius * 6) {
                    nearestPrey = enemy;
                    nearestPreyDist = dist;
                }
            }
        }

        // Check food
        for (const f of food) {
            const dx = f.x - this.x;
            const dy = f.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestFoodDist) {
                nearestFood = f;
                nearestFoodDist = dist;
            }
        }

        // Decision making - sometimes chase player, sometimes not
        if (nearestThreat && nearestThreatDist < this.radius * 5) {
            // Flee from threats
            this.state = 'flee';
            this.target = nearestThreat;
        } else if (canEatPlayer && playerDist < 800 && Math.random() < 0.5) {
            // 50% chance to chase player if we can eat them
            this.state = 'chase';
            this.target = player;
        } else if (nearestPrey && this.personality < 0.6) {
            // Chase other prey
            this.state = 'chase';
            this.target = nearestPrey;
        } else if (nearestFood && nearestFoodDist < 400) {
            // Go for food
            this.state = 'food';
            this.target = nearestFood;
        } else {
            // Wander
            this.state = 'wander';
            this.wanderAngle += (Math.random() - 0.5) * 0.5;
        }
    }

    update() {
        switch (this.state) {
            case 'flee':
                if (this.target) {
                    const dx = this.x - this.target.x;
                    const dy = this.y - this.target.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    this.targetX = this.x + (dx / dist) * 200;
                    this.targetY = this.y + (dy / dist) * 200;
                }
                break;
            case 'chase':
                if (this.target) {
                    this.targetX = this.target.x;
                    this.targetY = this.target.y;
                }
                break;
            case 'food':
                if (this.target) {
                    this.targetX = this.target.x;
                    this.targetY = this.target.y;
                }
                break;
            case 'wander':
            default:
                this.targetX = this.x + Math.cos(this.wanderAngle) * 100;
                this.targetY = this.y + Math.sin(this.wanderAngle) * 100;
                break;
        }

        // Keep target in bounds
        this.targetX = Math.max(50, Math.min(CONFIG.WORLD_WIDTH - 50, this.targetX));
        this.targetY = Math.max(50, Math.min(CONFIG.WORLD_HEIGHT - 50, this.targetY));

        super.update();
    }
}

class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.mass = CONFIG.FOOD_MASS;
        this.radius = 8;
        this.color = FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)];
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    draw(ctx, camera) {
        const screenX = (this.x - camera.x) * camera.zoom + canvas.width / 2;
        const screenY = (this.y - camera.y) * camera.zoom + canvas.height / 2;
        
        // Pulse animation
        const pulse = 1 + Math.sin(this.pulsePhase + Date.now() * 0.003) * 0.15;
        const screenRadius = this.radius * camera.zoom * pulse;

        // Skip if off-screen
        if (screenX + screenRadius < 0 || screenX - screenRadius > canvas.width ||
            screenY + screenRadius < 0 || screenY - screenRadius > canvas.height) {
            return;
        }

        // Glow
        const gradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, screenRadius * 2
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.color + '80');
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, screenRadius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 3 + Math.random() * 5;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.03;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.96;
        this.vy *= 0.96;
        this.life -= this.decay;
        return this.life > 0;
    }

    draw(ctx, camera) {
        const screenX = (this.x - camera.x) * camera.zoom + canvas.width / 2;
        const screenY = (this.y - camera.y) * camera.zoom + canvas.height / 2;
        const screenRadius = this.radius * camera.zoom * this.life;

        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ========================================
// GAME FUNCTIONS
// ========================================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function spawnFood() {
    const x = Math.random() * CONFIG.WORLD_WIDTH;
    const y = Math.random() * CONFIG.WORLD_HEIGHT;
    return new Food(x, y);
}

function spawnEnemy() {
    const x = 100 + Math.random() * (CONFIG.WORLD_WIDTH - 200);
    const y = 100 + Math.random() * (CONFIG.WORLD_HEIGHT - 200);
    const mass = CONFIG.MIN_MASS + Math.random() * 50;
    const name = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
    const color = CELL_COLORS[Math.floor(Math.random() * CELL_COLORS.length)];
    return new AICell(x, y, mass, name, color);
}

function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

function initGame(playerName) {
    // Initialize food
    gameState.food = [];
    for (let i = 0; i < CONFIG.FOOD_COUNT; i++) {
        gameState.food.push(spawnFood());
    }

    // Initialize enemies
    gameState.enemies = [];
    for (let i = 0; i < CONFIG.ENEMY_COUNT; i++) {
        gameState.enemies.push(spawnEnemy());
    }

    // Initialize player
    const playerColor = { main: '#00ffc8', glow: 'rgba(0, 255, 200, 0.5)' };
    gameState.player = new Cell(
        CONFIG.WORLD_WIDTH / 2,
        CONFIG.WORLD_HEIGHT / 2,
        CONFIG.PLAYER_START_MASS,
        playerName || 'Player',
        playerColor,
        true
    );

    // Reset state
    gameState.particles = [];
    gameState.camera = { x: gameState.player.x, y: gameState.player.y, zoom: 1 };
    gameState.startTime = Date.now();
    gameState.cellsEaten = 0;
    gameState.running = true;
    
    // Show quit button
    quitBtn.classList.add('visible');
}

function updateCamera() {
    // Smooth camera follow
    const targetZoom = Math.max(0.2, Math.min(1, 30 / Math.sqrt(gameState.player.mass)));
    gameState.camera.zoom += (targetZoom - gameState.camera.zoom) * 0.05;
    gameState.camera.x += (gameState.player.x - gameState.camera.x) * 0.1;
    gameState.camera.y += (gameState.player.y - gameState.camera.y) * 0.1;
}

function handlePlayerInput() {
    // Convert mouse position to world coordinates
    const worldX = (gameState.mouse.x - canvas.width / 2) / gameState.camera.zoom + gameState.camera.x;
    const worldY = (gameState.mouse.y - canvas.height / 2) / gameState.camera.zoom + gameState.camera.y;
    
    gameState.player.targetX = worldX;
    gameState.player.targetY = worldY;
}

function checkCollisions() {
    const player = gameState.player;

    // Player eating food
    for (let i = gameState.food.length - 1; i >= 0; i--) {
        const food = gameState.food[i];
        const dx = player.x - food.x;
        const dy = player.y - food.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.radius) {
            player.mass += food.mass;
            createParticles(food.x, food.y, food.color, 5);
            gameState.food.splice(i, 1);
            gameState.food.push(spawnFood());
        }
    }

    // Enemies eating food
    for (const enemy of gameState.enemies) {
        for (let i = gameState.food.length - 1; i >= 0; i--) {
            const food = gameState.food[i];
            const dx = enemy.x - food.x;
            const dy = enemy.y - food.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < enemy.radius) {
                enemy.mass += food.mass;
                gameState.food.splice(i, 1);
                gameState.food.push(spawnFood());
            }
        }
    }

    // Player eating enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];

        if (player.canEat(enemy)) {
            player.mass += enemy.mass * 0.8;
            createParticles(enemy.x, enemy.y, enemy.color.main, 15);
            gameState.enemies.splice(i, 1);
            gameState.cellsEaten++;
            
            // Respawn enemy after delay
            setTimeout(() => {
                if (gameState.running) {
                    gameState.enemies.push(spawnEnemy());
                }
            }, 2000);
        } else if (enemy.canEat(player)) {
            // Player gets eaten - game over
            createParticles(player.x, player.y, player.color.main, 20);
            gameOver();
            return;
        }
    }

    // Enemy vs Enemy
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            if (i === j) continue;
            const a = gameState.enemies[i];
            const b = gameState.enemies[j];

            if (a && b && a.canEat(b)) {
                a.mass += b.mass * 0.8;
                createParticles(b.x, b.y, b.color.main, 10);
                gameState.enemies.splice(j, 1);
                
                // Respawn
                setTimeout(() => {
                    if (gameState.running) {
                        gameState.enemies.push(spawnEnemy());
                    }
                }, 2000);
            }
        }
    }
}

function drawGrid() {
    const gridSize = CONFIG.GRID_SIZE;
    const camera = gameState.camera;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    // Calculate visible area
    const startX = Math.floor((camera.x - canvas.width / 2 / camera.zoom) / gridSize) * gridSize;
    const startY = Math.floor((camera.y - canvas.height / 2 / camera.zoom) / gridSize) * gridSize;
    const endX = camera.x + canvas.width / 2 / camera.zoom;
    const endY = camera.y + canvas.height / 2 / camera.zoom;

    // Vertical lines
    for (let x = startX; x < endX; x += gridSize) {
        const screenX = (x - camera.x) * camera.zoom + canvas.width / 2;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvas.height);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y < endY; y += gridSize) {
        const screenY = (y - camera.y) * camera.zoom + canvas.height / 2;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvas.width, screenY);
        ctx.stroke();
    }
}

function drawBoundary() {
    const camera = gameState.camera;
    
    // Draw world boundary
    const x = (0 - camera.x) * camera.zoom + canvas.width / 2;
    const y = (0 - camera.y) * camera.zoom + canvas.height / 2;
    const w = CONFIG.WORLD_WIDTH * camera.zoom;
    const h = CONFIG.WORLD_HEIGHT * camera.zoom;

    ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);

    // Danger zone gradient near edges
    const gradientSize = 100;
    
    // Top edge
    if (y > 0) {
        const gradient = ctx.createLinearGradient(0, y, 0, y + gradientSize);
        gradient.addColorStop(0, 'rgba(255, 50, 50, 0.3)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, gradientSize);
    }
}

function updateLeaderboard() {
    const allCells = [gameState.player, ...gameState.enemies]
        .filter(c => c)
        .sort((a, b) => b.mass - a.mass);

    // Find player's rank
    const playerRank = allCells.findIndex(c => c === gameState.player) + 1;
    
    // Get top 10
    const top10 = allCells.slice(0, 10);
    
    // Check if player is in top 10
    const playerInTop10 = top10.some(c => c === gameState.player);

    let html = top10.map((cell, i) => {
        const isPlayer = cell === gameState.player;
        return `
            <div class="leaderboard-entry ${isPlayer ? 'player' : ''}">
                <span class="leaderboard-rank">${i + 1}.</span>
                <span class="leaderboard-name">${cell.name}</span>
                <span class="leaderboard-score">${Math.floor(cell.mass)}</span>
            </div>
        `;
    }).join('');

    // If player is not in top 10, show them at the bottom with their actual rank
    if (!playerInTop10 && gameState.player) {
        html += `
            <div class="leaderboard-divider">···</div>
            <div class="leaderboard-entry player">
                <span class="leaderboard-rank">${playerRank}.</span>
                <span class="leaderboard-name">${gameState.player.name}</span>
                <span class="leaderboard-score">${Math.floor(gameState.player.mass)}</span>
            </div>
        `;
    }

    leaderboardList.innerHTML = html;
}

function gameLoop() {
    if (!gameState.running) return;

    // Clear canvas
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Handle input
    handlePlayerInput();

    // Update player
    gameState.player.update();

    // Slow mass decay for larger cells
    if (gameState.player.mass > 20) {
        gameState.player.mass -= gameState.player.mass * CONFIG.MASS_DECAY_RATE;
    }

    // Update camera
    updateCamera();

    // Update and draw grid
    drawGrid();
    drawBoundary();

    // Update AI
    for (const enemy of gameState.enemies) {
        enemy.think(gameState.player, gameState.enemies, gameState.food);
        enemy.update();
        
        // Mass decay for AI too
        if (enemy.mass > 20) {
            enemy.mass -= enemy.mass * CONFIG.MASS_DECAY_RATE;
        }
    }

    // Check collisions
    checkCollisions();

    // Draw food
    for (const food of gameState.food) {
        food.draw(ctx, gameState.camera);
    }

    // Draw cells (sorted by size, smaller on top)
    const allCells = [...gameState.enemies, gameState.player]
        .filter(c => c)
        .sort((a, b) => a.mass - b.mass);
    
    for (const cell of allCells) {
        cell.draw(ctx, gameState.camera);
    }

    // Update and draw particles
    gameState.particles = gameState.particles.filter(p => {
        const alive = p.update();
        if (alive) p.draw(ctx, gameState.camera);
        return alive;
    });

    // Update UI
    scoreDisplay.textContent = Math.floor(gameState.player.mass);
    updateLeaderboard();

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState.running = false;
    
    // Hide quit button
    quitBtn.classList.remove('visible');
    
    // Calculate stats
    const survivalSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(survivalSeconds / 60);
    const seconds = survivalSeconds % 60;

    finalScoreDisplay.textContent = Math.floor(gameState.player.mass);
    survivalTimeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    cellsEatenDisplay.textContent = gameState.cellsEaten;

    gameOverScreen.classList.remove('hidden');
}

function startGame() {
    const name = playerNameInput.value.trim() || 'Player';
    startScreen.style.display = 'none';
    gameOverScreen.classList.add('hidden');
    initGame(name);
    gameLoop();
}

// ========================================
// EVENT LISTENERS
// ========================================

window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('mousemove', (e) => {
    gameState.mouse.x = e.clientX;
    gameState.mouse.y = e.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    gameState.mouse.x = e.touches[0].clientX;
    gameState.mouse.y = e.touches[0].clientY;
});

playButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startGame();
});

quitBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to quit?')) {
        gameState.running = false;
        quitBtn.classList.remove('visible');
        startScreen.style.display = 'flex';
    }
});

// ========================================
// INITIALIZATION
// ========================================

resizeCanvas();

