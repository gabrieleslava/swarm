
export class LootManager {
    constructor(poolManager) {
        this.poolManager = poolManager;
        this.pickups = [];
    }

    reset() {
        // Release all
        this.pickups.forEach(p => {
            // In a perfect system we check the type and release to specific pool.
            // For now assume all are 'pickup'
            this.poolManager.release('pickup', p);
        });
        this.pickups = [];
    }

    spawnLoot(x, y, type = 'xp', value = 10) {
        const p = this.poolManager.get('pickup');
        if (p) {
            p.reset(x, y, value, type);
            this.pickups.push(p);
        }
    }

    update(deltaTime, player) {
        this.pickups.forEach(p => p.update(deltaTime, player));

        // Cleanup
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i];
            if (p.markedForDeletion) {
                this.poolManager.release('pickup', p);
                this.pickups.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.pickups.forEach(p => p.draw(ctx));
    }
}
