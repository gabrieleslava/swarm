import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { ASSETS } from '../assets.js';

export class Enemy {
    constructor(difficultyMultiplier = 1) {
        this.size = 16;
        this.active = true;
        this.reset(difficultyMultiplier);
    }

    reset(difficultyMultiplier = 1, enemyType = 'monster_slime') {
        // Position is now set by WaveManager immediately after reset
        // We initialize to 0 or keep previous to avoid undefined

        this.spriteType = enemyType;
        this.frame = 0;
        this.maxFrames = 4;
        this.frameTimer = 0;
        this.frameInterval = 150;
        this.markedForDeletion = false;
        this.angle = 0;
        this.active = true;

        // Base Stats Config
        const statsConfig = {
            'monster_slime': {
                baseHp: 20,
                baseDamage: 10,
                baseSpeed: 0.3,
                speedVar: 0.1
            },
            'monster_eye': {
                baseHp: 10,
                baseDamage: 15,
                baseSpeed: 0.5,
                speedVar: 0.2
            },
            'monster_skeleton': {
                baseHp: 40,
                baseDamage: 20,
                baseSpeed: 0.2, // Slow but tough
                speedVar: 0.05
            }
        };

        const config = statsConfig[enemyType] || statsConfig['monster_slime'];

        // Apply scaling
        this.maxHp = config.baseHp + (10 * difficultyMultiplier);
        this.hp = this.maxHp;
        this.damage = config.baseDamage + (2 * difficultyMultiplier);
        this.speed = config.baseSpeed + (Math.random() * config.speedVar * difficultyMultiplier);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            return true; // Died
        }
        return false;
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

            // Simple distance check
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

        // Update Animation Frame
        this.frameTimer += 16;
        if (this.frameTimer > this.frameInterval) {
            this.frame++;
            if (this.frame >= this.maxFrames) this.frame = 0;
            this.frameTimer = 0;
        }
    }

    draw(context) {
        if (!this.active) return;

        const img = ASSETS[this.spriteType];
        if (img && img.complete) {
            context.save();
            context.translate(this.x, this.y);

            // Flip if moving left
            const movingLeft = Math.cos(this.angle) < 0;
            if (movingLeft) {
                context.scale(-1, 1);
            }

            // Draw Sprite (Centered)
            const size = 48; // Rendered size
            const spriteSize = 64; // Source frame size

            context.drawImage(
                img,
                this.frame * spriteSize, 0, spriteSize, spriteSize,
                -size / 2, -size / 2, size, size
            );

            context.restore();
        } else {
            // Fallback
            context.fillStyle = '#0f0'; // Matrix green
            context.font = '24px "VT323"';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('@', this.x, this.y);
        }
    }
}
