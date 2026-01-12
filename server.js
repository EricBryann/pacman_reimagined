// ========================================
// AGAR.IO MULTIPLAYER SERVER
// ========================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// ========================================
// GAME CONFIGURATION
// ========================================

const CONFIG = {
    WORLD_WIDTH: 3000,
    WORLD_HEIGHT: 3000,
    FOOD_COUNT: 300,
    TOTAL_CELLS: 10,  // Total players + bots always equals this
    PLAYER_START_MASS: 10,
    MIN_MASS: 10,
    FOOD_MASS: 1,
    TICK_RATE: 60,
    MASS_DECAY_RATE: 0.0001,
    EAT_OVERLAP: 0.5,
};

// AI Names
const AI_NAMES = [
    'Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta', 'Bot Epsilon',
    'Bot Zeta', 'Bot Eta', 'Bot Theta', 'Bot Iota', 'Bot Kappa'
];

// Color palettes
const CELL_COLORS = [
    { main: '#ff6b6b', glow: 'rgba(255, 107, 107, 0.5)' },
    { main: '#4ecdc4', glow: 'rgba(78, 205, 196, 0.5)' },
    { main: '#45b7d1', glow: 'rgba(69, 183, 209, 0.5)' },
    { main: '#96ceb4', glow: 'rgba(150, 206, 180, 0.5)' },
    { main: '#ffeaa7', glow: 'rgba(255, 234, 167, 0.5)' },
    { main: '#fd79a8', glow: 'rgba(253, 121, 168, 0.5)' },
    { main: '#a29bfe', glow: 'rgba(162, 155, 254, 0.5)' },
    { main: '#00b894', glow: 'rgba(0, 184, 148, 0.5)' },
    { main: '#e17055', glow: 'rgba(225, 112, 85, 0.5)' },
    { main: '#74b9ff', glow: 'rgba(116, 185, 255, 0.5)' },
];

const FOOD_COLORS = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#fd79a8', '#a29bfe', '#00b894', '#e17055', '#74b9ff'
];

// ========================================
// ROOM MANAGEMENT
// ========================================

const rooms = new Map();

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function createRoom(hostId, hostName) {
    let code = generateRoomCode();
    while (rooms.has(code)) {
        code = generateRoomCode();
    }

    const room = {
        code,
        hostId,
        players: new Map(),
        food: [],
        ais: [],
        gameStarted: false,
        gameLoop: null,
    };

    // Initialize food
    for (let i = 0; i < CONFIG.FOOD_COUNT; i++) {
        room.food.push(createFood());
    }

    // AI bots will be initialized when game starts based on player count
    rooms.set(code, room);
    return room;
}

function updateBotCount(room) {
    const playerCount = room.players.size;
    const targetBotCount = Math.max(0, CONFIG.TOTAL_CELLS - playerCount);
    
    // Add bots if needed
    while (room.ais.length < targetBotCount) {
        room.ais.push(createAI(room.ais.length));
    }
    
    // Remove bots if too many (remove from the end)
    while (room.ais.length > targetBotCount) {
        room.ais.pop();
    }
}

function createFood() {
    return {
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * CONFIG.WORLD_WIDTH,
        y: Math.random() * CONFIG.WORLD_HEIGHT,
        mass: CONFIG.FOOD_MASS,
        radius: 8,
        color: FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)],
    };
}

function createAI(index) {
    const color = CELL_COLORS[Math.floor(Math.random() * CELL_COLORS.length)];
    return {
        id: `ai_${index}`,
        name: AI_NAMES[index % AI_NAMES.length],
        x: 100 + Math.random() * (CONFIG.WORLD_WIDTH - 200),
        y: 100 + Math.random() * (CONFIG.WORLD_HEIGHT - 200),
        mass: CONFIG.MIN_MASS + Math.random() * 40,
        color,
        isAI: true,
        targetX: CONFIG.WORLD_WIDTH / 2,
        targetY: CONFIG.WORLD_HEIGHT / 2,
        decisionTimer: 0,
        state: 'wander',
        wanderAngle: Math.random() * Math.PI * 2,
    };
}

function createPlayer(id, name) {
    const color = CELL_COLORS[Math.floor(Math.random() * CELL_COLORS.length)];
    return {
        id,
        name: name || 'Player',
        x: CONFIG.WORLD_WIDTH / 2 + (Math.random() - 0.5) * 500,
        y: CONFIG.WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 500,
        mass: CONFIG.PLAYER_START_MASS,
        color,
        isAI: false,
        targetX: CONFIG.WORLD_WIDTH / 2,
        targetY: CONFIG.WORLD_HEIGHT / 2,
        alive: true,
    };
}

function getRadius(mass) {
    return Math.sqrt(mass) * 4;
}

function getSpeed(mass) {
    return Math.max(1, 50 / Math.sqrt(mass)) * 0.0025 * 60;
}

function canEat(a, b) {
    if (a.mass <= b.mass * 1.1) return false;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < getRadius(a.mass) - getRadius(b.mass) * CONFIG.EAT_OVERLAP;
}

// ========================================
// GAME LOOP
// ========================================

function updateRoom(room) {
    if (!room.gameStarted) return;

    const allCells = [...room.players.values(), ...room.ais].filter(c => c.alive !== false);

    // Update all cells
    for (const cell of allCells) {
        // Calculate movement
        const dx = cell.targetX - cell.x;
        const dy = cell.targetY - cell.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
            const speed = getSpeed(cell.mass);
            cell.x += (dx / dist) * speed;
            cell.y += (dy / dist) * speed;
        }

        // Boundary collision
        const radius = getRadius(cell.mass);
        cell.x = Math.max(radius, Math.min(CONFIG.WORLD_WIDTH - radius, cell.x));
        cell.y = Math.max(radius, Math.min(CONFIG.WORLD_HEIGHT - radius, cell.y));

        // Mass decay
        if (cell.mass > 20) {
            cell.mass -= cell.mass * CONFIG.MASS_DECAY_RATE;
        }
    }

    // AI decision making
    for (const ai of room.ais) {
        if (ai.alive === false) continue;
        updateAI(ai, room);
    }

    // Check food collisions
    for (const cell of allCells) {
        const cellRadius = getRadius(cell.mass);
        for (let i = room.food.length - 1; i >= 0; i--) {
            const food = room.food[i];
            const dx = cell.x - food.x;
            const dy = cell.y - food.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < cellRadius) {
                cell.mass += food.mass;
                room.food.splice(i, 1);
                room.food.push(createFood());
            }
        }
    }

    // Check cell vs cell collisions
    for (let i = 0; i < allCells.length; i++) {
        for (let j = i + 1; j < allCells.length; j++) {
            const a = allCells[i];
            const b = allCells[j];

            if (canEat(a, b)) {
                a.mass += b.mass * 0.8;
                handleDeath(room, b);
            } else if (canEat(b, a)) {
                b.mass += a.mass * 0.8;
                handleDeath(room, a);
            }
        }
    }

    // Broadcast game state
    broadcastGameState(room);
}

function handleDeath(room, cell) {
    if (cell.isAI) {
        // Respawn AI after delay
        cell.alive = false;
        setTimeout(() => {
            cell.x = 100 + Math.random() * (CONFIG.WORLD_WIDTH - 200);
            cell.y = 100 + Math.random() * (CONFIG.WORLD_HEIGHT - 200);
            cell.mass = CONFIG.MIN_MASS + Math.random() * 30;
            cell.alive = true;
        }, 3000);
    } else {
        // Player death - wait for them to choose replay or spectate
        cell.alive = false;
        io.to(cell.id).emit('gameOver', { mass: Math.floor(cell.mass) });
    }
}

function respawnPlayer(room, playerId) {
    const player = room.players.get(playerId);
    if (player) {
        player.x = CONFIG.WORLD_WIDTH / 2 + (Math.random() - 0.5) * 500;
        player.y = CONFIG.WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 500;
        player.mass = CONFIG.PLAYER_START_MASS;
        player.alive = true;
        io.to(playerId).emit('respawn');
    }
}

function updateAI(ai, room) {
    ai.decisionTimer--;
    if (ai.decisionTimer > 0) return;
    ai.decisionTimer = 30 + Math.random() * 30;

    const allCells = [...room.players.values(), ...room.ais].filter(c => c.alive !== false && c !== ai);

    let nearestThreat = null;
    let nearestThreatDist = Infinity;
    let nearestPrey = null;
    let nearestPreyDist = Infinity;
    let nearestFood = null;
    let nearestFoodDist = Infinity;

    // Check other cells
    for (const cell of allCells) {
        const dx = cell.x - ai.x;
        const dy = cell.y - ai.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const aiRadius = getRadius(ai.mass);

        if (cell.mass > ai.mass * 1.1 && dist < aiRadius * 8 && dist < nearestThreatDist) {
            nearestThreat = cell;
            nearestThreatDist = dist;
        } else if (ai.mass > cell.mass * 1.1 && dist < aiRadius * 6 && dist < nearestPreyDist) {
            if (!cell.isAI || Math.random() < 0.3) {
                nearestPrey = cell;
                nearestPreyDist = dist;
            }
        }
    }

    // Check food
    for (const food of room.food) {
        const dx = food.x - ai.x;
        const dy = food.y - ai.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestFoodDist) {
            nearestFood = food;
            nearestFoodDist = dist;
        }
    }

    // Decision making
    const aiRadius = getRadius(ai.mass);
    if (nearestThreat && nearestThreatDist < aiRadius * 5) {
        // Flee
        const dx = ai.x - nearestThreat.x;
        const dy = ai.y - nearestThreat.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        ai.targetX = ai.x + (dx / dist) * 200;
        ai.targetY = ai.y + (dy / dist) * 200;
    } else if (nearestPrey && Math.random() < 0.5) {
        // Chase prey
        ai.targetX = nearestPrey.x;
        ai.targetY = nearestPrey.y;
    } else if (nearestFood && nearestFoodDist < 400) {
        // Go for food
        ai.targetX = nearestFood.x;
        ai.targetY = nearestFood.y;
    } else {
        // Wander
        ai.wanderAngle += (Math.random() - 0.5) * 0.5;
        ai.targetX = ai.x + Math.cos(ai.wanderAngle) * 100;
        ai.targetY = ai.y + Math.sin(ai.wanderAngle) * 100;
    }

    // Keep target in bounds
    ai.targetX = Math.max(50, Math.min(CONFIG.WORLD_WIDTH - 50, ai.targetX));
    ai.targetY = Math.max(50, Math.min(CONFIG.WORLD_HEIGHT - 50, ai.targetY));
}

function broadcastGameState(room) {
    // Send ALL players (including dead ones for leaderboard)
    const players = [];
    for (const [id, player] of room.players) {
        players.push({
            id: player.id,
            name: player.name,
            x: player.x,
            y: player.y,
            mass: player.mass,
            color: player.color,
            alive: player.alive !== false,
        });
    }

    // Send ALL AIs (including dead ones for leaderboard)
    const ais = room.ais.map(ai => ({
        id: ai.id,
        name: ai.name,
        x: ai.x,
        y: ai.y,
        mass: ai.mass,
        color: ai.color,
        isAI: true,
        alive: ai.alive !== false,
    }));

    const state = {
        players,
        ais,
        food: room.food,
        config: {
            WORLD_WIDTH: CONFIG.WORLD_WIDTH,
            WORLD_HEIGHT: CONFIG.WORLD_HEIGHT,
        },
        totalCells: players.length + ais.length,
    };

    io.to(room.code).emit('gameState', state);
}

function startGameLoop(room) {
    if (room.gameLoop) return;
    
    // Initialize bots based on player count
    updateBotCount(room);
    
    room.gameStarted = true;
    room.gameLoop = setInterval(() => updateRoom(room), 1000 / CONFIG.TICK_RATE);
}

function stopGameLoop(room) {
    if (room.gameLoop) {
        clearInterval(room.gameLoop);
        room.gameLoop = null;
    }
    room.gameStarted = false;
}

// ========================================
// SOCKET HANDLERS
// ========================================

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('createRoom', (data) => {
        const room = createRoom(socket.id, data.name);
        const player = createPlayer(socket.id, data.name);
        player.color = { main: '#00ffc8', glow: 'rgba(0, 255, 200, 0.5)' }; // Host gets special color
        room.players.set(socket.id, player);
        
        socket.join(room.code);
        socket.roomCode = room.code;
        
        socket.emit('roomCreated', { 
            code: room.code, 
            playerId: socket.id,
            isHost: true,
        });
        
        broadcastPlayerList(room);
        console.log(`Room ${room.code} created by ${data.name}`);
    });

    socket.on('joinRoom', (data) => {
        const room = rooms.get(data.code.toUpperCase());
        
        if (!room) {
            socket.emit('joinError', { message: 'Room not found' });
            return;
        }

        if (room.gameStarted) {
            socket.emit('joinError', { message: 'Game already in progress' });
            return;
        }

        const player = createPlayer(socket.id, data.name);
        room.players.set(socket.id, player);
        
        socket.join(room.code);
        socket.roomCode = room.code;
        
        socket.emit('roomJoined', { 
            code: room.code, 
            playerId: socket.id,
            isHost: false,
        });
        
        broadcastPlayerList(room);
        console.log(`${data.name} joined room ${room.code}`);
    });

    socket.on('startGame', () => {
        const room = rooms.get(socket.roomCode);
        if (!room || room.hostId !== socket.id) return;
        
        startGameLoop(room);
        io.to(room.code).emit('gameStarted');
        console.log(`Game started in room ${room.code}`);
    });

    socket.on('playerInput', (data) => {
        const room = rooms.get(socket.roomCode);
        if (!room) return;

        const player = room.players.get(socket.id);
        if (player && player.alive !== false) {
            player.targetX = data.targetX;
            player.targetY = data.targetY;
        }
    });

    socket.on('requestRespawn', () => {
        const room = rooms.get(socket.roomCode);
        if (!room) return;
        respawnPlayer(room, socket.id);
    });

    socket.on('disconnect', () => {
        const room = rooms.get(socket.roomCode);
        if (!room) return;

        room.players.delete(socket.id);
        console.log(`Player ${socket.id} disconnected from room ${socket.roomCode}`);

        if (room.players.size === 0) {
            stopGameLoop(room);
            rooms.delete(room.code);
            console.log(`Room ${room.code} deleted (empty)`);
        } else {
            // Bot count stays fixed once game starts - no dynamic adjustment
            
            if (room.hostId === socket.id) {
                // Transfer host to next player
                const nextHost = room.players.keys().next().value;
                room.hostId = nextHost;
                io.to(nextHost).emit('becameHost');
            }
            broadcastPlayerList(room);
        }
    });
});

function broadcastPlayerList(room) {
    const playerList = [];
    for (const [id, player] of room.players) {
        playerList.push({
            id,
            name: player.name,
            isHost: id === room.hostId,
        });
    }
    const botCount = CONFIG.TOTAL_CELLS - room.players.size;
    io.to(room.code).emit('playerList', { 
        players: playerList, 
        hostId: room.hostId,
        botCount: botCount,
        totalCells: CONFIG.TOTAL_CELLS
    });
}

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎮 Agar Multiplayer Server running on http://localhost:${PORT}`);
});

