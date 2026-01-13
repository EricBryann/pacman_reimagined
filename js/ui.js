// ========================================
// UI ELEMENTS & EVENT HANDLERS
// ========================================

// UI Element References
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const playButton = document.getElementById('play-button');
const restartButton = document.getElementById('restart-button');
const playerNameInput = document.getElementById('player-name');
const scoreDisplay = document.getElementById('score');
const leaderboardList = document.getElementById('leaderboard-list');
const finalScoreDisplay = document.getElementById('final-score');
const survivalTimeDisplay = document.getElementById('survival-time');
const cellsEatenDisplay = document.getElementById('cells-eaten');
const quitBtn = document.getElementById('quit-btn');
const quitToMenuBtn = document.getElementById('quit-to-menu-button');

// ========================================
// GAME START/RESTART
// ========================================

function startCountdown(callback) {
    startScreen.style.display = 'none';
    gameOverScreen.classList.add('hidden');
    countdownOverlay.classList.remove('hidden');
    
    let count = 3;
    countdownNumber.textContent = count;
    countdownNumber.classList.remove('go');
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumber.textContent = count;
        } else if (count === 0) {
            countdownNumber.textContent = 'GO!';
            countdownNumber.classList.add('go');
        } else {
            clearInterval(countdownInterval);
            countdownOverlay.classList.add('hidden');
            callback();
        }
    }, 1000);
}

function startGame() {
    const name = playerNameInput.value.trim() || 'Player';
    startCountdown(() => {
        initGame(name);
        gameLoop();
    });
}

// ========================================
// EVENT LISTENERS
// ========================================

// Play buttons
playButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Enter key to start
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startGame();
});

// Quit button (during gameplay)
quitBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to quit?')) {
        gameState.running = false;
        quitBtn.classList.remove('visible');
        startScreen.style.display = 'flex';
    }
});

// Quit to menu button (on game over screen)
quitToMenuBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startScreen.style.display = 'flex';
    playerNameInput.focus();
});

// Mouse movement
canvas.addEventListener('mousemove', (e) => {
    gameState.mouse.x = e.clientX;
    gameState.mouse.y = e.clientY;
});

// Touch support for mobile
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    gameState.mouse.x = e.touches[0].clientX;
    gameState.mouse.y = e.touches[0].clientY;
});

// ========================================
// INITIALIZATION
// ========================================

// Focus on name input when page loads
playerNameInput.focus();

