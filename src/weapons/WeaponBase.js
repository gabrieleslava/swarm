
export class WeaponBase {
    /**
     * @param {Object} config - Initial configuration
     * @param {string} config.name
     * @param {Object} config.stats - Base stats
     */
    constructor(config) {
        this.name = config.name || "Unknown Weapon";
        this.level = 1;

        // Base Stats (Immutable config)
        this.baseStats = {
            damage: config.stats.damage || 10,
            cooldown: config.stats.cooldown || 1000,
            area: config.stats.area || 1, // Size multiplier
            speed: config.stats.speed || 10,
            duration: config.stats.duration || 1,
            count: config.stats.count || 1,
            ...config.stats
        };

        // Current Stats (Mutable by upgrades)
        this.currentStats = { ...this.baseStats };

        this.cooldownTimer = 0;
    }

    /**
     * @param {number} deltaTime 
     * @param {Object} context - { player, enemies, poolManager }
     */
    update(deltaTime, context) {
        // Cooldown reduction logic (Hyperbolic scaling: RealCD = Base / (1 + Haste%))
        // For simplicity here, we assume player haste is passed or handled in 'fire'.
        // Let's keep it simple: player.stats.abilityHaste reduces this timer target?
        // Or just standard:

        this.cooldownTimer += deltaTime;

        // Calculate dynamic cooldown based on player haste
        // For now, use currentStats.cooldown directly. 
        // Any modification by player stats should happen when stats are recalculated or applied on use.

        if (this.cooldownTimer >= this.currentStats.cooldown) {
            // Check if can fire (e.g. enemies strictly required?)
            if (this.canFire(context)) {
                this.fire(context);
                this.cooldownTimer = 0;
            }
        }
    }

    canFire(context) {
        return true;
    }

    fire(context) {
        console.warn("fire() not implemented for " + this.name);
    }

    upgrade() {
        this.level++;
        // Stat scaling logic would go here
        // For prototype, just reduce cooldown by 10%
        this.currentStats.damage *= 1.1;
        this.currentStats.cooldown *= 0.9;
    }
}
