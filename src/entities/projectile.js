import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export class Projectile {
    constructor(x, y, angle) {
        this.radius = 4;
        this.speed = 8;
        this.active = true;
        this.reset(x, y, angle);
    }

    reset(x, y, angle, behavior = null) {
        this.x = x;
        this.y = y;
        this.active = true;
        this.behavior = behavior;
        this.timer = 0; // Usage by behaviors or TTL
        this.maxLife = 2000; // 2 Seconds Life

        // Default Linear Physics
        if (angle !== undefined) {
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        this.markedForDeletion = false;
    }

    update(deltaTime = 16) {
        if (this.behavior) {
            // Custom behavior (Orbital, Boomerang, etc)
            // It returns true if it handled movement, false if we should run default
            const handled = this.behavior(this, deltaTime);
            if (handled) return;
        }

        // Default Linear Movement
        this.x += this.vx;
        this.y += this.vy;

        // Life Timer (TTL) - Replaces Bounds check which causes bugs in scrolling world
        this.timer += deltaTime;
        if (this.timer > this.maxLife) {
            this.active = false;
            this.markedForDeletion = true;
        }
    }

    draw(context) {
        context.fillStyle = '#ff0';
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
    }
}
