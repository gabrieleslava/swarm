
import { WeaponBase } from './WeaponBase.js';

export class ProjectileWeapon extends WeaponBase {
    constructor(config) {
        super(config);
    }

    canFire(context) {
        // Only fire if there are enemies? Or just always valid?
        // Auto-aim weapons need a target.
        // We'll calculate target in fire(), so effectively can always *try* to fire.
        return true;
    }

    fire(context) {
        const { player, enemies, poolManager } = context;

        // Auto-Aim Logic: Find nearest
        let nearest = null;
        let minDistSq = Infinity;
        const range = 600; // Weapon range

        for (const e of enemies) {
            if (!e.active) continue;
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < range ** 2 && distSq < minDistSq) {
                minDistSq = distSq;
                nearest = e;
            }
        }

        let targetAngle = 0;

        if (nearest) {
            targetAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
        } else {
            // No target: shoot direction player is facing or moving?
            // If player moving, use velocity. Else random or right.
            if (player.velocity && (player.velocity.x !== 0 || player.velocity.y !== 0)) {
                targetAngle = Math.atan2(player.velocity.y, player.velocity.x);
            } else {
                // If idle and no enemy, maybe don't fire?
                // For "Bullet Heaven", often random fire or just wait.
                // Let's return to save ammo/CPU.
                return;
            }
        }

        // Multishot Logic (Count)
        const count = Math.floor(this.currentStats.count);
        // Spread angle (e.g. 15 degrees)
        const spread = 0.2; // radians

        for (let i = 0; i < count; i++) {
            // Calculate angle offset
            // i=0 -> 0
            // i=1 -> -spread/2, +spread/2 ?
            // Simple approach: centered spread
            const offset = (i - (count - 1) / 2) * spread;
            const finalAngle = targetAngle + offset;

            const p = poolManager.get('projectile');
            if (p) {
                // Hack: Pass damage via internal property or refactor Projectile
                // For now, Projectile is simple visual. Logic expects Projectile to handle collision.
                // We should inject stats into projectile.
                p.damage = this.currentStats.damage;
                p.reset(player.x, player.y, finalAngle);

                // Add to game loop array - Context must provide this access
                // Assuming access via context.projectiles or we push wrapper?
                // The caller (Player.update) needs to handle the created objects?
                // BETTER: poolManager.get returns it, but we need to put it in the main 'projectiles' list.
                // We should add it to context.projectiles
                context.projectiles.push(p);
            }
        }

        // Play Sound (Once per burst)
        if (context.audioManager) {
            context.audioManager.playShoot();
        }
    }
}
