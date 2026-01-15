// ========================================
// GAME STATE & MAIN LOOP
// ========================================

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State - central state object
const gameState = {
    running: false,
    player: null,
    enemies: [],
    food: [],
    powerFood: [],
    particles: [],
    camera: { x: 0, y: 0, zoom: 1 },
    mouse: { x: 0, y: 0 },
    startTime: 0,
    cellsEaten: 0,
    freezeEndTime: 0,  // When freeze effect ends
};

// ========================================
// SPAWNING FUNCTIONS
// ========================================

function spawnFood() {
    return new Food(
        Math.random() * CONFIG.WORLD_WIDTH,
        Math.random() * CONFIG.WORLD_HEIGHT
    );
}

function spawnPowerFood() {
    return new PowerFood(
        100 + Math.random() * (CONFIG.WORLD_WIDTH - 200),
        100 + Math.random() * (CONFIG.WORLD_HEIGHT - 200),
        'freeze'
    );
}

function isFrozen() {
    return Date.now() < gameState.freezeEndTime;
}

function spawnEnemy() {
    const x = 100 + Math.random() * (CONFIG.WORLD_WIDTH - 200);
    const y = 100 + Math.random() * (CONFIG.WORLD_HEIGHT - 200);
    const mass = CONFIG.MIN_MASS + Math.random() * 50;
    const name = randomFromArray(AI_NAMES);
    const color = randomFromArray(CELL_COLORS);
    return new AICell(x, y, mass, name, color);
}

// ========================================
// GAME INITIALIZATION
// ========================================

function initGame(playerName) {
    // Initialize food
    gameState.food = [];
    for (let i = 0; i < CONFIG.FOOD_COUNT; i++) {
        gameState.food.push(spawnFood());
    }

    // Initialize power food
    gameState.powerFood = [];
    for (let i = 0; i < CONFIG.POWER_FOOD_COUNT; i++) {
        gameState.powerFood.push(spawnPowerFood());
    }

    // Initialize enemies
    gameState.enemies = [];
    for (let i = 0; i < CONFIG.ENEMY_COUNT; i++) {
        gameState.enemies.push(spawnEnemy());
    }

    // Initialize player
    gameState.player = new Cell(
        CONFIG.WORLD_WIDTH / 2,
        CONFIG.WORLD_HEIGHT / 2,
        CONFIG.PLAYER_START_MASS,
        playerName || 'Player',
        PLAYER_COLOR,
        true
    );

    // Reset state
    gameState.particles = [];
    gameState.camera = { x: gameState.player.x, y: gameState.player.y, zoom: 1 };
    gameState.startTime = Date.now();
    gameState.cellsEaten = 0;
    gameState.freezeEndTime = 0;
    gameState.running = true;
    
    // Start analytics session
    PlayerAnalytics.startSession();
    
    // Show quit button
    quitBtn.classList.add('visible');
}

// ========================================
// CAMERA
// ========================================

function updateCamera() {
    const targetZoom = Math.max(0.2, Math.min(1, 30 / Math.sqrt(gameState.player.mass)));
    gameState.camera.zoom = lerp(gameState.camera.zoom, targetZoom, 0.05);
    gameState.camera.x = lerp(gameState.camera.x, gameState.player.x, 0.1);
    gameState.camera.y = lerp(gameState.camera.y, gameState.player.y, 0.1);
}

// ========================================
// INPUT HANDLING
// ========================================

function handlePlayerInput() {
    const worldX = (gameState.mouse.x - canvas.width / 2) / gameState.camera.zoom + gameState.camera.x;
    const worldY = (gameState.mouse.y - canvas.height / 2) / gameState.camera.zoom + gameState.camera.y;
    gameState.player.targetX = worldX;
    gameState.player.targetY = worldY;
}

// ========================================
// COLLISION DETECTION
// ========================================

function checkCollisions() {
    const player = gameState.player;
    const frozen = isFrozen();

    // Player eating power food
    for (let i = gameState.powerFood.length - 1; i >= 0; i--) {
        const pf = gameState.powerFood[i];
        const dist = getDistance(player.x, player.y, pf.x, pf.y);

        if (dist < player.radius + pf.radius) {
            player.mass += pf.mass;
            
            // Activate freeze power-up
            if (pf.type === 'freeze') {
                gameState.freezeEndTime = Date.now() + CONFIG.FREEZE_DURATION;
                createParticles(pf.x, pf.y, '#00d4ff', 20);
            }
            
            PlayerAnalytics.trackPowerUp();
            gameState.powerFood.splice(i, 1);
            
            // Respawn power food after delay
            setTimeout(() => {
                if (gameState.running) {
                    gameState.powerFood.push(spawnPowerFood());
                }
            }, 15000);  // 15 seconds respawn time
        }
    }

    // Player eating food
    for (let i = gameState.food.length - 1; i >= 0; i--) {
        const food = gameState.food[i];
        const dist = getDistance(player.x, player.y, food.x, food.y);

        if (dist < player.radius) {
            player.mass += food.mass;
            createParticles(food.x, food.y, food.color, 5);
            gameState.food.splice(i, 1);
            gameState.food.push(spawnFood());
            PlayerAnalytics.trackFoodEaten();
        }
    }

    // Enemies eating food (only if not frozen)
    if (!frozen) {
        for (const enemy of gameState.enemies) {
            for (let i = gameState.food.length - 1; i >= 0; i--) {
                const food = gameState.food[i];
                const dist = getDistance(enemy.x, enemy.y, food.x, food.y);

                if (dist < enemy.radius) {
                    enemy.mass += food.mass;
                    gameState.food.splice(i, 1);
                    gameState.food.push(spawnFood());
                }
            }
        }
    }

    // Player eating enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];

        if (player.canEat(enemy)) {
            PlayerAnalytics.trackCellEaten(player.mass, enemy.mass);
            player.mass += enemy.mass * 0.8;
            createParticles(enemy.x, enemy.y, enemy.color.main, 15);
            gameState.enemies.splice(i, 1);
            gameState.cellsEaten++;
            
            setTimeout(() => {
                if (gameState.running) {
                    gameState.enemies.push(spawnEnemy());
                }
            }, 2000);
        } else if (enemy.canEat(player)) {
            // Track close call if enemy was close
            const dist = getDistance(player.x, player.y, enemy.x, enemy.y);
            if (dist < enemy.radius * 1.5) {
                PlayerAnalytics.trackCloseCall();
            }
            createParticles(player.x, player.y, player.color.main, 20);
            gameOver();
            return;
        } else if (enemy.mass > player.mass) {
            // Track close calls with larger enemies
            const dist = getDistance(player.x, player.y, enemy.x, enemy.y);
            if (dist < enemy.radius * 2) {
                PlayerAnalytics.trackCloseCall();
            }
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
                
                setTimeout(() => {
                    if (gameState.running) {
                        gameState.enemies.push(spawnEnemy());
                    }
                }, 2000);
            }
        }
    }
}

// ========================================
// RENDERING
// ========================================

function drawGrid() {
    const gridSize = CONFIG.GRID_SIZE;
    const camera = gameState.camera;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    const startX = Math.floor((camera.x - canvas.width / 2 / camera.zoom) / gridSize) * gridSize;
    const startY = Math.floor((camera.y - canvas.height / 2 / camera.zoom) / gridSize) * gridSize;
    const endX = camera.x + canvas.width / 2 / camera.zoom;
    const endY = camera.y + canvas.height / 2 / camera.zoom;

    for (let x = startX; x < endX; x += gridSize) {
        const screenX = (x - camera.x) * camera.zoom + canvas.width / 2;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvas.height);
        ctx.stroke();
    }

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
    const x = (0 - camera.x) * camera.zoom + canvas.width / 2;
    const y = (0 - camera.y) * camera.zoom + canvas.height / 2;
    const w = CONFIG.WORLD_WIDTH * camera.zoom;
    const h = CONFIG.WORLD_HEIGHT * camera.zoom;

    ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);

    // Danger zone gradient near edges
    const gradientSize = 100;
    if (y > 0) {
        const gradient = ctx.createLinearGradient(0, y, 0, y + gradientSize);
        gradient.addColorStop(0, 'rgba(255, 50, 50, 0.3)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, gradientSize);
    }
}

function drawFreezeOverlay() {
    // Screen edge frost effect
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.3,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.8
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.7, 'rgba(0, 180, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 200, 255, 0.15)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Freeze timer indicator
    const remainingTime = Math.max(0, gameState.freezeEndTime - Date.now());
    const seconds = Math.ceil(remainingTime / 1000);
    
    ctx.font = 'bold 24px Orbitron, sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(`❄ FROZEN: ${seconds}s ❄`, canvas.width / 2, 100);
    ctx.shadowBlur = 0;
}

// ========================================
// LEADERBOARD
// ========================================

function updateLeaderboard() {
    const allCells = [gameState.player, ...gameState.enemies]
        .filter(c => c)
        .sort((a, b) => b.mass - a.mass);

    const playerRank = allCells.findIndex(c => c === gameState.player) + 1;
    const top10 = allCells.slice(0, 10);
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

// ========================================
// MAIN GAME LOOP
// ========================================

function gameLoop() {
    if (!gameState.running) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Handle input
    handlePlayerInput();

    // Update player
    gameState.player.update();

    // Track analytics
    PlayerAnalytics.updateMaxMass(gameState.player.mass);
    PlayerAnalytics.trackPosition(gameState.player.x, gameState.player.y);

    // Mass decay for larger cells
    if (gameState.player.mass > 20) {
        gameState.player.mass -= gameState.player.mass * CONFIG.MASS_DECAY_RATE;
    }

    // Update camera
    updateCamera();

    // Draw world
    drawGrid();
    drawBoundary();

    // Update AI (only if not frozen)
    const frozen = isFrozen();
    for (const enemy of gameState.enemies) {
        if (!frozen) {
            enemy.think(gameState.player, gameState.enemies, gameState.food);
            enemy.update();
        }
        
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

    // Draw power food
    for (const pf of gameState.powerFood) {
        pf.draw(ctx, gameState.camera);
    }

    // Draw cells (sorted by size, smaller on top)
    const allCells = [...gameState.enemies, gameState.player]
        .filter(c => c)
        .sort((a, b) => a.mass - b.mass);
    
    for (const cell of allCells) {
        cell.draw(ctx, gameState.camera, frozen && cell !== gameState.player);
    }

    // Draw freeze overlay effect
    if (frozen) {
        drawFreezeOverlay();
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

// ========================================
// GAME OVER
// ========================================

function gameOver() {
    gameState.running = false;
    quitBtn.classList.remove('visible');
    
    const survivalSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(survivalSeconds / 60);
    const seconds = survivalSeconds % 60;

    finalScoreDisplay.textContent = Math.floor(gameState.player.mass);
    survivalTimeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    cellsEatenDisplay.textContent = gameState.cellsEaten;

    // Save analytics and display feedback
    PlayerAnalytics.saveSession();
    displayFeedback();

    gameOverScreen.classList.remove('hidden');
}

function displayFeedback() {
    const recommendations = PlayerAnalytics.generateRecommendations();
    const feedbackContainer = document.getElementById('feedback-recommendations');
    const historyContainer = document.getElementById('history-stats');
    
    // Display recommendations
    if (recommendations.length > 0) {
        feedbackContainer.innerHTML = recommendations.map(rec => `
            <div class="recommendation-card priority-${rec.priority}">
                <span class="recommendation-icon">${rec.icon}</span>
                <div class="recommendation-content">
                    <div class="recommendation-title">${rec.title}</div>
                    <div class="recommendation-message">${rec.message}</div>
                </div>
            </div>
        `).join('');
    } else {
        feedbackContainer.innerHTML = `
            <div class="recommendation-card priority-3">
                <span class="recommendation-icon">🎮</span>
                <div class="recommendation-content">
                    <div class="recommendation-title">Keep Playing!</div>
                    <div class="recommendation-message">Play a few more games to get personalized recommendations.</div>
                </div>
            </div>
        `;
    }
    
    // Display historical stats
    const stats = PlayerAnalytics.getSummaryStats();
    if (stats) {
        historyContainer.innerHTML = `
            <div class="history-stat">
                <div class="history-stat-value">${stats.totalGames}</div>
                <div class="history-stat-label">Games Played</div>
            </div>
            <div class="history-stat">
                <div class="history-stat-value">${stats.avgSurvivalTime}s</div>
                <div class="history-stat-label">Avg Survival</div>
            </div>
            <div class="history-stat">
                <div class="history-stat-value">${stats.bestMass}</div>
                <div class="history-stat-label">Best Mass</div>
            </div>
            <div class="history-stat">
                <div class="history-stat-value">${stats.totalCellsEaten}</div>
                <div class="history-stat-label">Total Kills</div>
            </div>
        `;
    } else {
        historyContainer.innerHTML = `
            <p style="color: #666; font-size: 12px; text-align: center;">
                Your stats will appear here after more games.
            </p>
        `;
    }
}

// ========================================
// CANVAS RESIZE
// ========================================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initialize canvas with white background
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

