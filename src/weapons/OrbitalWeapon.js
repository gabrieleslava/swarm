
import { WeaponBase } from './WeaponBase.js';

export class OrbitalWeapon extends WeaponBase {
    constructor(config) {
        super(config);
        this.activeProjectiles = [];
        this.baseOrbitRadius = 80;
    }

    // Override update to manage permanent projectiles
    update(deltaTime, context) {
        // Stats
        const count = Math.floor(this.currentStats.count);
        const speed = this.currentStats.speed * 0.001; // Scale speed for rotation (radians/ms)
        const radius = this.baseOrbitRadius * this.currentStats.area;

        const { player, poolManager, projectiles } = context;

        // Ensure we have correct number of projectiles
        if (this.activeProjectiles.length < count) {
            // Spawn missing key projectiles
            const needed = count - this.activeProjectiles.length;
            for (let i = 0; i < needed; i++) {
                const p = poolManager.get('projectile');
                this._setupProjectile(p, player);
                this.activeProjectiles.push(p);
                projectiles.push(p); // Register for collision/drawing in main loop
            }
        } else if (this.activeProjectiles.length > count) {
            // Remove excess
            const toRemove = this.activeProjectiles.splice(count);
            toRemove.forEach(p => {
                p.markedForDeletion = true; // Let game loop clean it up
            });
        }

        // Update Projectiles Behavior
        // We define a closure for the behavior to keep access to 'this' (weapon state) 
        // OR we just set properties on p.
        // Actually, Projectile.update() calls p.behavior(p, dt).

        // We need to keep indices stable for spacing?
        // Let's assign an index to each projectile in the list so they space out evenly.

        this.activeProjectiles.forEach((p, index) => {
            // Refresh behavior data in case stats changed
            p.orbitalData = {
                center: player, // Follow player
                radius: radius,
                speed: speed,
                angleOffset: (index / this.activeProjectiles.length) * Math.PI * 2
            };

            // Check if p is still active (it might have been deleted by game loop colliding??)
            // Wait, for Orbital weapons, usually they pierce infinitely or have high health?
            // "Cyclonic Slicers" usually don't die on contact. They are permanent.

            // If main game loop kills it on contact, we have a problem.
            // We need to set p.markedForDeletion = false explicitly every frame?
            // OR we change game loop collision logic to check 'p.pierce' property.
            // For now, let's just respawn them if they are gone (in next update loop).

            if (p.active === false || p.markedForDeletion) {
                // It died. Remove from our list so we respawn next frame.
                // Actually splice it out now?
                // For simplicity, we filter the list at start of next update?
                // Let's just reset deletion flag here to make them immortal for now.
                p.markedForDeletion = false;
            }
        });
    }

    _setupProjectile(p, player) {
        // Define Behavior Function
        const orbitBehavior = (pEntity, dt) => {
            // pEntity.timer counts up
            pEntity.timer += dt;

            const data = pEntity.orbitalData;
            if (!data) return false;

            // angle = time * speed + offset
            const currentAngle = (pEntity.timer * data.speed) + data.angleOffset;

            // Position
            pEntity.x = data.center.x + Math.cos(currentAngle) * data.radius;
            pEntity.y = data.center.y + Math.sin(currentAngle) * data.radius;

            return true; // Handled movement
        };

        p.reset(player.x, player.y, 0, orbitBehavior);
        p.orbitalData = {}; // Placeholder until update fills it
        p.radius = 6; // slightly bigger
        // Make them distinct color? Game loop draws yellow. 
        // We can add color prop to Projectile later.
    }
}
