
export class Pickup {
    constructor() {
        this.reset(0, 0, 10);
    }

    reset(x, y, value = 10, type = 'xp') {
        this.x = x;
        this.y = y;
        this.value = value;
        this.type = type; // 'xp', 'gold', 'health'
        this.active = true;
        this.markedForDeletion = false;

        this.size = 8;
        this.isMagnetized = false;
        this.magnetSpeed = 0;
    }

    update(deltaTime, player) {
        if (!this.active) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;
        const radius = player.stats.pickupRadius;

        // Magnet check
        if (!this.isMagnetized) {
            if (distSq < radius * radius) {
                this.isMagnetized = true;
            }
        }

        if (this.isMagnetized) {
            // Accelerate towards player
            this.magnetSpeed += deltaTime * 0.05; // Acceleration
            const dist = Math.sqrt(distSq);

            if (dist > 0) {
                this.x += (dx / dist) * this.magnetSpeed;
                this.y += (dy / dist) * this.magnetSpeed;
            }

            // Collection Check (Collision with player body)
            if (dist < player.width / 2 + this.size) {
                // Collect
                player.gainXp(this.value);
                this.markedForDeletion = true;
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.fillStyle = this.type === 'xp' ? '#00ccff' : '#ffcc00';
        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x + this.size, this.y);
        ctx.lineTo(this.x, this.y + this.size);
        ctx.lineTo(this.x - this.size, this.y);
        ctx.fill();
    }
}
