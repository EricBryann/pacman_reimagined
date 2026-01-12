// ========================================
// FOOD CLASS - Collectible food pellets
// ========================================

class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.mass = CONFIG.FOOD_MASS;
        this.radius = 8;
        this.color = randomFromArray(FOOD_COLORS);
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

