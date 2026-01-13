// ========================================
// CELL CLASS - Base class for all cells
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
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
            const speed = this.speed * 60;
            this.vx = (dx / dist) * speed;
            this.vy = (dy / dist) * speed;
        } else {
            this.vx *= 0.9;
            this.vy *= 0.9;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Keep within world bounds
        this.x = clamp(this.x, this.radius, CONFIG.WORLD_WIDTH - this.radius);
        this.y = clamp(this.y, this.radius, CONFIG.WORLD_HEIGHT - this.radius);
    }

    canEat(other) {
        if (this.mass <= other.mass * 1.1) return false;
        const dist = getDistance(this.x, this.y, other.x, other.y);
        return dist < this.radius - other.radius * CONFIG.EAT_OVERLAP;
    }

    draw(ctx, camera, frozen = false) {
        const screenX = (this.x - camera.x) * camera.zoom + canvas.width / 2;
        const screenY = (this.y - camera.y) * camera.zoom + canvas.height / 2;
        const screenRadius = this.radius * camera.zoom;

        // Skip if off-screen
        if (screenX + screenRadius < 0 || screenX - screenRadius > canvas.width ||
            screenY + screenRadius < 0 || screenY - screenRadius > canvas.height) {
            return;
        }

        // Frozen color override
        const mainColor = frozen ? '#88ccff' : this.color.main;
        const glowColor = frozen ? 'rgba(136, 204, 255, 0.5)' : this.color.glow;

        // Outer glow
        const gradient = ctx.createRadialGradient(
            screenX, screenY, screenRadius * 0.5,
            screenX, screenY, screenRadius * 1.3
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.7, glowColor);
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
        bodyGradient.addColorStop(0, frozen ? '#ffffff' : lightenColor(this.color.main, 40));
        bodyGradient.addColorStop(0.5, mainColor);
        bodyGradient.addColorStop(1, frozen ? '#4488bb' : darkenColor(this.color.main, 20));

        ctx.beginPath();
        ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
        ctx.fillStyle = bodyGradient;
        ctx.fill();

        // Subtle border (icy border when frozen)
        ctx.strokeStyle = frozen ? '#aaddff' : darkenColor(this.color.main, 30);
        ctx.lineWidth = Math.max(2, screenRadius * 0.05);
        ctx.stroke();

        // Ice crystals effect when frozen
        if (frozen && screenRadius > 20) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const innerR = screenRadius * 0.3;
                const outerR = screenRadius * 0.7;
                ctx.beginPath();
                ctx.moveTo(
                    screenX + Math.cos(angle) * innerR,
                    screenY + Math.sin(angle) * innerR
                );
                ctx.lineTo(
                    screenX + Math.cos(angle) * outerR,
                    screenY + Math.sin(angle) * outerR
                );
                ctx.stroke();
            }
        }

        // Name label
        if (screenRadius > 15) {
            const fontSize = Math.max(12, Math.min(screenRadius * 0.4, 24));
            ctx.font = `bold ${fontSize}px 'Exo 2', sans-serif`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.fillText(this.name, screenX, screenY);
            ctx.shadowBlur = 0;
        }
    }
}

