// ========================================
// AI CELL CLASS - Computer controlled cells
// ========================================

class AICell extends Cell {
    constructor(x, y, mass, name, color) {
        super(x, y, mass, name, color, false);
        this.personality = Math.random(); // 0 = aggressive, 1 = passive
        this.decisionTimer = 0;
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.state = 'wander'; // wander, chase, flee, food
        this.target = null;
    }

    think(player, enemies, food) {
        this.decisionTimer--;
        if (this.decisionTimer > 0) return;
        this.decisionTimer = 30 + Math.random() * 30;

        let nearestThreat = null;
        let nearestThreatDist = Infinity;
        let nearestPrey = null;
        let nearestPreyDist = Infinity;
        let nearestFood = null;
        let nearestFoodDist = Infinity;
        let canEatPlayer = false;
        let playerDist = Infinity;

        // Check player
        if (player) {
            playerDist = getDistance(this.x, this.y, player.x, player.y);

            if (player.mass > this.mass * 1.1 && playerDist < this.radius * 8) {
                nearestThreat = player;
                nearestThreatDist = playerDist;
            } else if (this.mass > player.mass * 1.1) {
                canEatPlayer = true;
                nearestPrey = player;
                nearestPreyDist = playerDist;
            }
        }

        // Check other enemies (if not already hunting player)
        if (!canEatPlayer) {
            for (const enemy of enemies) {
                if (enemy === this) continue;
                const dist = getDistance(this.x, this.y, enemy.x, enemy.y);

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
            const dist = getDistance(this.x, this.y, f.x, f.y);
            if (dist < nearestFoodDist) {
                nearestFood = f;
                nearestFoodDist = dist;
            }
        }

        // Decision making
        if (nearestThreat && nearestThreatDist < this.radius * 5) {
            this.state = 'flee';
            this.target = nearestThreat;
        } else if (canEatPlayer && playerDist < 800 && Math.random() < 0.5) {
            this.state = 'chase';
            this.target = player;
        } else if (nearestPrey && this.personality < 0.6) {
            this.state = 'chase';
            this.target = nearestPrey;
        } else if (nearestFood && nearestFoodDist < 400) {
            this.state = 'food';
            this.target = nearestFood;
        } else {
            this.state = 'wander';
            this.wanderAngle += (Math.random() - 0.5) * 0.5;
        }
    }

    update() {
        switch (this.state) {
            case 'flee':
                if (this.target) {
                    const dist = getDistance(this.x, this.y, this.target.x, this.target.y);
                    const dx = this.x - this.target.x;
                    const dy = this.y - this.target.y;
                    this.targetX = this.x + (dx / dist) * 200;
                    this.targetY = this.y + (dy / dist) * 200;
                }
                break;
            case 'chase':
            case 'food':
                if (this.target) {
                    this.targetX = this.target.x;
                    this.targetY = this.target.y;
                }
                break;
            default: // wander
                this.targetX = this.x + Math.cos(this.wanderAngle) * 100;
                this.targetY = this.y + Math.sin(this.wanderAngle) * 100;
        }

        // Keep target in bounds
        this.targetX = clamp(this.targetX, 50, CONFIG.WORLD_WIDTH - 50);
        this.targetY = clamp(this.targetY, 50, CONFIG.WORLD_HEIGHT - 50);

        super.update();
    }
}

