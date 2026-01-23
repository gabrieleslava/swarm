
export class FloatingText {
    constructor() {
        this.reset(0, 0, '', '#fff');
    }

    reset(x, y, text, color = '#fff') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.velocitySub = 0; // Speed upwards
        this.lifeTimer = 0;
        this.duration = 800; // ms
        this.active = true;
        this.markedForDeletion = false;
        this.alpha = 1;
        this.scale = 1;
    }

    update(deltaTime) {
        if (!this.active) return;

        this.lifeTimer += deltaTime;
        if (this.lifeTimer > this.duration) {
            this.markedForDeletion = true;
            return;
        }

        // Move Up
        this.y -= (0.05 * deltaTime);

        // Fade Out
        const halfLife = this.duration / 2;
        if (this.lifeTimer > halfLife) {
            this.alpha = 1 - ((this.lifeTimer - halfLife) / halfLife);
        }

        // Scale pop effect
        if (this.lifeTimer < 100) {
            this.scale = 1 + (this.lifeTimer / 100) * 0.5;
        } else {
            this.scale = 1.5;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.font = `bold ${Math.floor(20 * this.scale)}px "Arial"`; // Scaled font
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';

        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}
