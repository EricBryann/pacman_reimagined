// ========================================
// POWER FOOD CLASS - Special power-up items
// ========================================

class PowerFood {
    constructor(x, y, type = 'freeze') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.mass = 3;
        this.radius = 15;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.rotationAngle = 0;
        
        // Freeze power-up colors (icy blue)
        this.color = '#00d4ff';
        this.glowColor = 'rgba(0, 212, 255, 0.6)';
        this.innerColor = '#ffffff';
    }

    draw(ctx, camera) {
        const screenX = (this.x - camera.x) * camera.zoom + canvas.width / 2;
        const screenY = (this.y - camera.y) * camera.zoom + canvas.height / 2;
        
        // Pulse and rotation animation
        const pulse = 1 + Math.sin(this.pulsePhase + Date.now() * 0.004) * 0.2;
        this.rotationAngle += 0.02;
        const screenRadius = this.radius * camera.zoom * pulse;

        // Skip if off-screen
        if (screenX + screenRadius * 3 < 0 || screenX - screenRadius * 3 > canvas.width ||
            screenY + screenRadius * 3 < 0 || screenY - screenRadius * 3 > canvas.height) {
            return;
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotationAngle);

        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, screenRadius * 3);
        gradient.addColorStop(0, this.glowColor);
        gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.2)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(0, 0, screenRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw snowflake/star shape
        ctx.beginPath();
        const spikes = 6;
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? screenRadius : screenRadius * 0.5;
            const angle = (i * Math.PI) / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        
        // Fill with gradient
        const starGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, screenRadius);
        starGradient.addColorStop(0, this.innerColor);
        starGradient.addColorStop(0.5, this.color);
        starGradient.addColorStop(1, '#0099cc');
        
        ctx.fillStyle = starGradient;
        ctx.fill();
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * camera.zoom;
        ctx.stroke();

        // Inner sparkle
        ctx.beginPath();
        ctx.arc(0, 0, screenRadius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();

        // Draw "FREEZE" label
        ctx.font = `bold ${Math.max(8, 10 * camera.zoom)}px Orbitron, sans-serif`;
        ctx.fillStyle = '#00d4ff';
        ctx.textAlign = 'center';
        ctx.fillText('❄ FREEZE', screenX, screenY + screenRadius * 2.5);
    }
}




