// ========================================
// PLAYER ANALYTICS & FEEDBACK SYSTEM
// ========================================

const PlayerAnalytics = {
    // Storage key for localStorage
    STORAGE_KEY: 'pacman_player_history',

    // Current game session data
    currentSession: {
        startTime: 0,
        maxMass: 0,
        cellsEaten: 0,
        powerUpsCollected: 0,
        foodEaten: 0,
        timeNearEdge: 0,
        timeInCenter: 0,
        closeCallsWithEnemies: 0,
        aggressiveKills: 0,  // Kills when enemy was close in size
    },

    // Initialize analytics for a new game
    startSession() {
        this.currentSession = {
            startTime: Date.now(),
            maxMass: CONFIG.PLAYER_START_MASS,
            cellsEaten: 0,
            powerUpsCollected: 0,
            foodEaten: 0,
            timeNearEdge: 0,
            timeInCenter: 0,
            closeCallsWithEnemies: 0,
            aggressiveKills: 0,
        };
    },

    // Update max mass if current mass is higher
    updateMaxMass(mass) {
        if (mass > this.currentSession.maxMass) {
            this.currentSession.maxMass = mass;
        }
    },

    // Track food eaten
    trackFoodEaten() {
        this.currentSession.foodEaten++;
    },

    // Track cell eaten
    trackCellEaten(playerMass, enemyMass) {
        this.currentSession.cellsEaten++;
        // If enemy was at least 50% of player's mass, it's an aggressive kill
        if (enemyMass >= playerMass * 0.5) {
            this.currentSession.aggressiveKills++;
        }
    },

    // Track power-up collected
    trackPowerUp() {
        this.currentSession.powerUpsCollected++;
    },

    // Track position for edge vs center time
    trackPosition(playerX, playerY) {
        const edgeThreshold = 300;
        const centerX = CONFIG.WORLD_WIDTH / 2;
        const centerY = CONFIG.WORLD_HEIGHT / 2;
        const centerRadius = 500;

        const nearEdge = playerX < edgeThreshold || 
                         playerX > CONFIG.WORLD_WIDTH - edgeThreshold ||
                         playerY < edgeThreshold || 
                         playerY > CONFIG.WORLD_HEIGHT - edgeThreshold;

        const distFromCenter = Math.sqrt(
            Math.pow(playerX - centerX, 2) + 
            Math.pow(playerY - centerY, 2)
        );

        if (nearEdge) {
            this.currentSession.timeNearEdge++;
        }
        if (distFromCenter < centerRadius) {
            this.currentSession.timeInCenter++;
        }
    },

    // Track close calls (when a larger enemy gets close)
    trackCloseCall() {
        this.currentSession.closeCallsWithEnemies++;
    },

    // Get historical data from localStorage
    getHistory() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : { games: [], totalGames: 0 };
        } catch (e) {
            return { games: [], totalGames: 0 };
        }
    },

    // Save current session to history
    saveSession() {
        const history = this.getHistory();
        const survivalTime = Date.now() - this.currentSession.startTime;

        const gameData = {
            timestamp: Date.now(),
            survivalTime: survivalTime,
            maxMass: this.currentSession.maxMass,
            cellsEaten: this.currentSession.cellsEaten,
            powerUpsCollected: this.currentSession.powerUpsCollected,
            foodEaten: this.currentSession.foodEaten,
            timeNearEdge: this.currentSession.timeNearEdge,
            timeInCenter: this.currentSession.timeInCenter,
            closeCallsWithEnemies: this.currentSession.closeCallsWithEnemies,
            aggressiveKills: this.currentSession.aggressiveKills,
        };

        history.games.push(gameData);
        history.totalGames++;

        // Keep only last 20 games for analysis
        if (history.games.length > 20) {
            history.games = history.games.slice(-20);
        }

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.warn('Could not save analytics:', e);
        }

        return gameData;
    },

    // Generate recommendations based on historical patterns
    generateRecommendations() {
        const history = this.getHistory();
        const recommendations = [];
        const currentGame = this.currentSession;
        const survivalTime = (Date.now() - currentGame.startTime) / 1000;

        // Need at least current game data
        const games = history.games;
        const hasHistory = games.length >= 3;

        // Calculate averages from history
        let avgSurvivalTime = survivalTime;
        let avgMaxMass = currentGame.maxMass;
        let avgCellsEaten = currentGame.cellsEaten;
        let avgPowerUps = currentGame.powerUpsCollected;
        let avgEdgeTime = currentGame.timeNearEdge;

        if (hasHistory) {
            avgSurvivalTime = games.reduce((sum, g) => sum + g.survivalTime, 0) / games.length / 1000;
            avgMaxMass = games.reduce((sum, g) => sum + g.maxMass, 0) / games.length;
            avgCellsEaten = games.reduce((sum, g) => sum + g.cellsEaten, 0) / games.length;
            avgPowerUps = games.reduce((sum, g) => sum + g.powerUpsCollected, 0) / games.length;
            avgEdgeTime = games.reduce((sum, g) => sum + g.timeNearEdge, 0) / games.length;
        }

        // === SURVIVAL TIME RECOMMENDATIONS ===
        if (survivalTime < 30) {
            recommendations.push({
                icon: '⏱️',
                title: 'Quick Death Detected',
                message: 'You died very quickly! Focus on eating food first to grow before engaging enemies.',
                priority: 1
            });
        } else if (hasHistory && survivalTime > avgSurvivalTime * 1.5) {
            recommendations.push({
                icon: '🏆',
                title: 'Great Survival!',
                message: `You survived ${Math.floor(survivalTime)}s - ${Math.floor((survivalTime / avgSurvivalTime - 1) * 100)}% longer than your average!`,
                priority: 3
            });
        }

        // === MASS/GROWTH RECOMMENDATIONS ===
        if (currentGame.maxMass < 25) {
            recommendations.push({
                icon: '🍎',
                title: 'Eat More Food',
                message: 'Try collecting more food pellets to grow. Larger size makes you harder to eat!',
                priority: 1
            });
        } else if (currentGame.maxMass > 100) {
            recommendations.push({
                icon: '💪',
                title: 'Impressive Growth!',
                message: `You reached mass ${Math.floor(currentGame.maxMass)}! You're becoming a dominant player.`,
                priority: 3
            });
        }

        // === POWER-UP RECOMMENDATIONS ===
        if (currentGame.powerUpsCollected === 0 && survivalTime > 20) {
            recommendations.push({
                icon: '❄️',
                title: 'Use Power-Ups!',
                message: 'You didn\'t collect any freeze power-ups. They can freeze enemies and save your life!',
                priority: 2
            });
        } else if (currentGame.powerUpsCollected >= 2) {
            recommendations.push({
                icon: '⚡',
                title: 'Power-Up Pro!',
                message: 'Great job collecting power-ups! They give you a significant advantage.',
                priority: 3
            });
        }

        // === POSITIONING RECOMMENDATIONS ===
        const totalPositionTime = currentGame.timeNearEdge + currentGame.timeInCenter;
        if (totalPositionTime > 0) {
            const edgePercent = currentGame.timeNearEdge / totalPositionTime;
            
            if (edgePercent > 0.4) {
                recommendations.push({
                    icon: '🚧',
                    title: 'Avoid the Edges',
                    message: 'You spend a lot of time near map edges where escape routes are limited. Stay closer to the center!',
                    priority: 2
                });
            } else if (currentGame.timeInCenter > totalPositionTime * 0.5) {
                recommendations.push({
                    icon: '🎯',
                    title: 'Good Positioning!',
                    message: 'You\'re staying near the center where you have more escape options. Keep it up!',
                    priority: 3
                });
            }
        }

        // === PLAYSTYLE RECOMMENDATIONS ===
        if (currentGame.cellsEaten === 0 && survivalTime > 30) {
            recommendations.push({
                icon: '🐢',
                title: 'Too Passive',
                message: 'You didn\'t eat any enemies! Once you\'re bigger, try hunting smaller cells for faster growth.',
                priority: 2
            });
        } else if (currentGame.aggressiveKills >= 3) {
            recommendations.push({
                icon: '🦁',
                title: 'Aggressive Hunter!',
                message: 'You\'re taking risks by eating cells close to your size. High risk, high reward!',
                priority: 3
            });
        }

        // === CLOSE CALLS RECOMMENDATIONS ===
        if (currentGame.closeCallsWithEnemies > 5) {
            recommendations.push({
                icon: '😰',
                title: 'Living Dangerously',
                message: 'You had many close calls with larger enemies. Try to keep more distance from threats!',
                priority: 2
            });
        }

        // === IMPROVEMENT TRACKING ===
        if (hasHistory) {
            const recentGames = games.slice(-5);
            const olderGames = games.slice(-10, -5);
            
            if (recentGames.length >= 3 && olderGames.length >= 3) {
                const recentAvgMass = recentGames.reduce((s, g) => s + g.maxMass, 0) / recentGames.length;
                const olderAvgMass = olderGames.reduce((s, g) => s + g.maxMass, 0) / olderGames.length;
                
                if (recentAvgMass > olderAvgMass * 1.2) {
                    recommendations.push({
                        icon: '📈',
                        title: 'You\'re Improving!',
                        message: 'Your recent games show better performance than before. Keep practicing!',
                        priority: 3
                    });
                }
            }
        }

        // Sort by priority (1 = important warnings, 3 = positive feedback)
        // Show warnings first, then tips, then praise
        recommendations.sort((a, b) => a.priority - b.priority);

        // Return top 4 recommendations
        return recommendations.slice(0, 4);
    },

    // Get summary stats for display
    getSummaryStats() {
        const history = this.getHistory();
        
        if (history.games.length === 0) {
            return null;
        }

        const games = history.games;
        return {
            totalGames: history.totalGames,
            avgSurvivalTime: Math.floor(games.reduce((s, g) => s + g.survivalTime, 0) / games.length / 1000),
            bestMass: Math.floor(Math.max(...games.map(g => g.maxMass))),
            totalCellsEaten: games.reduce((s, g) => s + g.cellsEaten, 0),
            avgMass: Math.floor(games.reduce((s, g) => s + g.maxMass, 0) / games.length),
        };
    }
};

