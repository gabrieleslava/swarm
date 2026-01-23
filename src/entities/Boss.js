import { Enemy } from './enemy.js';
import { ASSETS } from '../assets.js';

export class Boss extends Enemy {
    constructor() {
        super(5); // Higher difficulty base
        this.size = 64; // Huge
        this.hp = 5000;
        this.maxHp = 5000;
        this.spriteColor = '#ff0000';
    }

    reset(difficultyMultiplier = 1) {
        super.reset(difficultyMultiplier);
        this.size = 64;
        this.hp = 5000 * difficultyMultiplier;
        this.maxHp = this.hp;
        this.speed = 0.4 + (Math.random() * 0.1); // Very slow
        this.spriteColor = '#ff0000';
    }

    // Override draw to show HP bar
    draw(context) {
        if (!this.active) return;

        const img = ASSETS['boss_demon'];
        if (img && img.complete) {
            context.save();
            context.translate(this.x, this.y);

            // Flip if moving left
            // Boss likely moves towards player, so use same angle logic
            if (Math.cos(this.angle) < 0) {
                context.scale(-1, 1);
            }

            // Draw Sprite
            context.drawImage(img, -this.size / 2, -this.size / 2, this.size, this.size);
            context.restore();
        } else {
            // Body
            context.fillStyle = this.spriteColor;
            context.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);

            // Face
            context.fillStyle = '#000';
            context.font = '40px "VT323"';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('👹', this.x, this.y);
        }

        // HP Bar
        const hpPercent = this.hp / this.maxHp;
        context.fillStyle = '#cc0000';
        context.fillRect(this.x - 30, this.y - 45, 60, 6);
        context.fillStyle = '#00ff00';
        context.fillRect(this.x - 30, this.y - 45, 60 * hpPercent, 6);
    }
}
