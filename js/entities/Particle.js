// ========================================
// PARTICLE CLASS - Visual effects
// ========================================

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

// Helper function to create multiple particles
function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

