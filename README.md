# PACMAN REIMAGINED

A single-player Agar.io clone with AI enemies built with vanilla HTML, CSS, and JavaScript.

![Game Preview](assets/preview.png)

## 🎮 How to Play

1. Open `index.html` in any modern web browser
2. Enter your name and click PLAY
3. Move your mouse to control your cell
4. Eat food (small colored dots) to grow
5. Eat cells smaller than you to grow faster
6. Avoid cells larger than you - or get eaten!

## 📁 Project Structure

```
agar/
├── index.html              # Main HTML file - open this to play
├── README.md               # This file
├── css/
│   └── styles.css          # All game styles
├── js/
│   ├── config.js           # Game configuration & constants
│   ├── utils.js            # Utility functions
│   ├── game.js             # Main game loop & state
│   ├── ui.js               # UI event handlers
│   └── entities/
│       ├── Cell.js         # Base cell class
│       ├── AICell.js       # AI-controlled cell
│       ├── Food.js         # Food pellet class
│       └── Particle.js     # Visual effects
└── assets/                 # For images, sounds, etc.
```

## 🔧 Customization

### Game Settings

Edit `js/config.js` to modify:

```javascript
const CONFIG = {
    WORLD_WIDTH: 2500,      // Arena width
    WORLD_HEIGHT: 2500,     // Arena height
    FOOD_COUNT: 250,        // Number of food pellets
    ENEMY_COUNT: 20,        // Number of AI enemies
    PLAYER_START_MASS: 10,  // Starting size
    SPEED_FACTOR: 0.0025,   // Movement speed multiplier
};
```

### Adding New AI Names

Add names to the `AI_NAMES` array in `config.js`:

```javascript
const AI_NAMES = [
    'Blob Master', 'CellKing', 'Hungry', 
    // Add your names here...
];
```

### Adding New Colors

Add color objects to `CELL_COLORS` in `config.js`:

```javascript
const CELL_COLORS = [
    { main: '#ff6b6b', glow: 'rgba(255, 107, 107, 0.5)' },
    // Add your colors here...
];
```

## 🚀 Extending the Game

### Adding a New Entity Type

1. Create a new file in `js/entities/` (e.g., `PowerUp.js`)
2. Define your class:

```javascript
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        // ... other properties
    }
    
    update() {
        // Update logic
    }
    
    draw(ctx, camera) {
        // Rendering logic
    }
}
```

3. Add the script to `index.html` before `game.js`:

```html
<script src="js/entities/PowerUp.js"></script>
```

4. Add an array to `gameState` in `game.js`:

```javascript
const gameState = {
    // ... existing properties
    powerups: [],
};
```

### Adding New Game Modes

1. Create a new file `js/modes/SurvivalMode.js`
2. Extend or modify the game loop
3. Add mode selection to the UI

### Adding Sound Effects

1. Place audio files in `assets/sounds/`
2. Create `js/audio.js`:

```javascript
const SOUNDS = {
    eat: new Audio('assets/sounds/eat.mp3'),
    death: new Audio('assets/sounds/death.mp3'),
};

function playSound(name) {
    SOUNDS[name].currentTime = 0;
    SOUNDS[name].play();
}
```

3. Add to `index.html` and call `playSound('eat')` when needed

## 🎨 Styling

All styles are in `css/styles.css`, organized into sections:

- **Base Styles** - Reset and body
- **Game Container & Canvas** - Main game area
- **UI Overlay** - HUD elements
- **Score Display** - Mass counter
- **Leaderboard** - Rankings
- **Quit Button** - Exit game
- **Start Screen** - Title and input
- **Game Over Screen** - Death screen
- **Responsive Styles** - Mobile support

## 📱 Mobile Support

The game includes basic touch support. Move your finger on the screen to control your cell.

## 🛠️ Development

No build tools required! Just edit the files and refresh your browser.

For live reloading during development, you can use any simple HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve

# Then open http://localhost:8000
```

## 📄 License

MIT License - feel free to use, modify, and share!
