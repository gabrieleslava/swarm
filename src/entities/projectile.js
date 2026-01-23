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
        this.timer = 0; // Usage by behaviors

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

        // Screen bounds check (only for linear default really, but good safety)
        // Behaviors might want to override this (e.g. Boomerang comes back), 
        // so maybe move this into 'default' block if behavior is null?
        // Let's keep it but allow behavior to disable 'markedForDeletion' if needed?
        // For now, if behavior is set, we assume it manages lifetime or we put this check inside 'if (!handled)'?
        // Let's leave bounds check generic but maybe relax it?

        if (!this.behavior && (this.x < 0 || this.x > GAME_WIDTH || this.y < 0 || this.y > GAME_HEIGHT)) {
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
