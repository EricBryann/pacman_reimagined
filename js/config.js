// ========================================
// GAME CONFIGURATION
// ========================================
// Modify these values to adjust gameplay

const CONFIG = {
    // World settings
    WORLD_WIDTH: 2500,
    WORLD_HEIGHT: 2500,
    GRID_SIZE: 50,

    // Entity counts
    FOOD_COUNT: 250,
    ENEMY_COUNT: 20,
    POWER_FOOD_COUNT: 3,

    // Player settings
    PLAYER_START_MASS: 10,
    MIN_MASS: 10,

    // Gameplay mechanics
    FOOD_MASS: 1,
    SPEED_FACTOR: 0.0025,
    MASS_DECAY_RATE: 0.0001,
    EAT_OVERLAP: 0.5,
    FREEZE_DURATION: 5000,  // 5 seconds freeze duration

    // Visual settings
    ZOOM_FACTOR: 0.04,
};

// AI enemy names - add more for variety
const AI_NAMES = [
    'Blob Master', 'CellKing', 'Hungry', 'Nomster', 'BigBoi',
    'Destroyer', 'Swift', 'Hunter', 'Predator', 'Stealth',
    'Titan', 'Ghost', 'Phantom', 'Shadow', 'Ninja',
    'Dragon', 'Viper', 'Cobra', 'Eagle', 'Hawk',
    'Thunder', 'Storm', 'Blaze', 'Frost', 'Ice',
    'Chaos', 'Void', 'Nova', 'Cosmic', 'Stellar'
];

// Color palettes for cells - add more colors here
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

// Player color (special)
const PLAYER_COLOR = { main: '#00ffc8', glow: 'rgba(0, 255, 200, 0.5)' };

