
import { ProjectileWeapon } from '../weapons/ProjectileWeapon.js';
import { OrbitalWeapon } from '../weapons/OrbitalWeapon.js';

export class EvolutionManager {
    constructor() {
        this.activeWeapons = [];
        this.availableWeapons = [
            {
                id: 'crossbow',
                type: 'projectile',
                config: {
                    name: 'Crossbow',
                    stats: { damage: 15, cooldown: 1000, count: 1, speed: 10 }
                }
            },
            {
                id: 'multishot_bow',
                type: 'projectile',
                config: {
                    name: 'Triple Bow',
                    stats: { damage: 8, cooldown: 1500, count: 3, speed: 12 }
                }
            },
            {
                id: 'blade_orbit',
                type: 'orbital',
                config: {
                    name: 'Cyclonic Blades',
                    stats: { damage: 5, cooldown: 0, count: 2, speed: 2, area: 1 } // Cooldown 0 = infinite duration logic
                }
            }
        ];
    }

    // Initialize with a starter weapon
    init(player) {
        this.addWeapon(player, 'crossbow');
        this.addWeapon(player, 'blade_orbit'); // Demo: Give orbital immediately
    }

    addWeapon(player, weaponId) {
        const template = this.availableWeapons.find(w => w.id === weaponId);
        if (!template) return;

        let newWeapon;
        if (template.type === 'projectile') {
            newWeapon = new ProjectileWeapon(template.config);
        } else if (template.type === 'orbital') {
            newWeapon = new OrbitalWeapon(template.config);
        }

        if (newWeapon) {
            this.activeWeapons.push(newWeapon);
            console.log(`Added weapon: ${newWeapon.name}`);
        }
    }

    update(deltaTime, context) {
        this.activeWeapons.forEach(w => w.update(deltaTime, context));
    }

    getUpgrades(count = 3) {
        // Return random upgrades
        // For prototype: Mix of Stat Upgrades and Weapons
        const options = [];

        // 1. Stat: Heal
        options.push({
            id: 'heal',
            type: 'stat',
            name: 'Cura Full',
            description: 'Recupera 50 HP',
            value: 50
        });

        // 2. Stat: Speed
        options.push({
            id: 'speed',
            type: 'stat',
            name: 'Velocidade',
            description: '+10% Velocidade de Movimento',
            value: 0.1
        });

        // 3. New Weapon (if available) - Mock
        // Find a weapon we don't have? Or upgrade existing?
        // Let's offer a generic "Power Up" for now which buffs all weapons
        options.push({
            id: 'might',
            type: 'stat',
            name: 'Força',
            description: '+10% Dano Global',
            value: 0.1
        });

        return options;
    }

    applyUpgrade(player, upgrade) {
        if (upgrade.id === 'heal') {
            // Heal logic
            // player.health is not fully implemented yet, assume maxHealth stat
            console.log("Healed!");
        } else if (upgrade.id === 'speed') {
            player.stats.moveSpeed *= (1 + upgrade.value);
        } else if (upgrade.id === 'might') {
            // Buff active weapons
            this.activeWeapons.forEach(w => {
                w.currentStats.damage *= (1 + upgrade.value);
            });
        }

        console.log("Applied Upgrade: " + upgrade.name);
    }
}
