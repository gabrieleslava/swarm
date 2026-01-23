import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export class Enemy {
    constructor(difficultyMultiplier = 1) {
        this.size = 16;
        this.active = true;
        this.reset(difficultyMultiplier);
    }

    reset(difficultyMultiplier = 1) {
        // Position is now set by WaveManager immediately after reset
        // We initialize to 0 or keep previous to avoid undefined
        this.speed = 1 + (Math.random() * 0.5 * difficultyMultiplier);
        this.markedForDeletion = false;
        this.angle = 0;
        this.active = true;
    }

    update(playerX, playerY, otherEnemies = []) {
        if (!this.active) return;

        // ... (Steering and Movement Logic) ...
        const dx = playerX - this.x;
        const dy = playerY - this.y;

        let desiredAngle = Math.atan2(dy, dx);

        // --- Steering: Separation ---
        let sepX = 0;
        let sepY = 0;
        let count = 0;
        const separationRadius = 24;

        for (const other of otherEnemies) {
            if (other === this || !other.active) continue;

            const distSq = (this.x - other.x) ** 2 + (this.y - other.y) ** 2;
            if (distSq < separationRadius ** 2) {
                sepX += (this.x - other.x);
                sepY += (this.y - other.y);
                count++;
            }
        }

        if (count > 0) {
            this.x += sepX * 0.05;
            this.y += sepY * 0.05;
        }

        this.angle = desiredAngle;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    draw(context) {
        if (!this.active) return;
        context.fillStyle = '#0f0'; // Matrix green
        context.font = '24px "VT323"';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('@', this.x, this.y);
    }
}
