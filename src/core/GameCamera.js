
export class GameCamera {
    constructor(viewWidth, viewHeight) {
        this.x = 0;
        this.y = 0;
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;

        // Smooth damp properties
        this.currentX = 0;
        this.currentY = 0;
        this.target = null;
        this.smoothTime = 0.15; // Time to reach target approx
        this.velocity = { x: 0, y: 0 };
    }

    follow(targetObject) {
        this.target = targetObject;
    }

    update(deltaTime) {
        if (!this.target) return;

        // Center camera on target
        // We want target to be in middle: camX + viewW/2 = targetX => camX = targetX - viewW/2
        const destX = this.target.x - this.viewWidth / 2;
        const destY = this.target.y - this.viewHeight / 2;

        // Simple Lerp for now (delta agnostic approximation)
        // For robust SmoothDamp we need proper math, but lerp is okay with fixed steps
        const t = Math.min(1, deltaTime / (this.smoothTime * 1000));
        // Or simpler: just lerp 10% per frame if deltaTime is variable
        const smoothing = 0.1;

        // Lerp
        this.x += (destX - this.x) * smoothing;
        this.y += (destY - this.y) * smoothing;

        // Round to avoid sub-pixel blurring
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
    }

    /**
     * Apply camera transform to context
     * @param {CanvasRenderingContext2D} ctx 
     */
    apply(ctx) {
        ctx.save();
        ctx.translate(-this.x, -this.y);
    }

    /**
     * Restore context (call at end of frame)
     * @param {CanvasRenderingContext2D} ctx 
     */
    reset(ctx) {
        ctx.restore();
    }

    /**
     * Convert screen coordinates (mouse) to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }
}
