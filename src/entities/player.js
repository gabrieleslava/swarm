import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { ASSETS } from '../assets.js';
import { Projectile } from './projectile.js';

export const player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    width: 32, // Hitbox size
    height: 32,
    speed: 3,
    shootTimer: 0,
    shootInterval: 1000,
    // Animation
    currentFrame: 0,
    maxFrames: 6, // Default for walk
    frameTimer: 0,
    frameInterval: 100,
    state: 'idle', // walk, throw, walkAttack, idle
    attackTimer: 0, // Time remaining for attack animation
    attackDuration: 500, // ms
    sprites: {
        idle: { frames: 4 },
        walk: { frames: 6 },
        throw: { frames: 4 },
        walkAttack: { frames: 6 }
    },
    isMoving: false,

    initSprites() {
        this.sprites.idle.img = ASSETS.idle;
        this.sprites.walk.img = ASSETS.walk;
        this.sprites.throw.img = ASSETS.throw;
        this.sprites.walkAttack.img = ASSETS.walkAttack;
    },

    // Stats Struct
    stats: {
        moveSpeed: 3,
        maxHealth: 100,
        currentHealth: 100, // Added
        pickupRadius: 100, // Increased
        abilityHaste: 0,
        xp: 0,
        level: 1,
        nextLevelXp: 100
    },

    gainXp(amount) {
        this.stats.xp += amount;
        if (this.stats.xp >= this.stats.nextLevelXp) {
            this.levelUp();
        }
    },

    levelUp() {
        this.stats.xp -= this.stats.nextLevelXp;
        this.stats.level++;
        this.stats.nextLevelXp = Math.floor(this.stats.nextLevelXp * 1.5);
        this.stats.currentHealth = this.stats.maxHealth; // Heal on level
        console.log("Level Up! " + this.stats.level);

        if (this.onLevelUp) {
            this.onLevelUp(this.stats.level);
        }
    },

    takeDamage(amount) {
        this.stats.currentHealth -= amount;
        if (this.stats.currentHealth <= 0) {
            this.stats.currentHealth = 0;
            return true; // Died
        }
        return false;
    },

    // Physics
    velocity: { x: 0, y: 0 },

    reset() {
        this.x = GAME_WIDTH / 2;
        this.y = GAME_HEIGHT / 2;
        this.velocity = { x: 0, y: 0 };
        this.shootTimer = 0;
        this.state = 'idle';
        this.isMoving = false;

        // Reset Stats
        this.stats.currentHealth = this.stats.maxHealth;
        this.stats.xp = 0;
        this.stats.level = 1;
        this.stats.nextLevelXp = 100;
        this.stats.moveSpeed = 3;
    },

    update(deltaTime, inputManager, enemies, projectiles, poolManager) {
        // --- 1. Movement Physics ---
        const input = inputManager.getAxis();
        if (input.x !== 0 || input.y !== 0) {
            this.velocity.x = input.x * this.stats.moveSpeed;
            this.velocity.y = input.y * this.stats.moveSpeed;

            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.isMoving = true;
        } else {
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.isMoving = false;
        }

        // Clamp to map bounds (optional, but good for now)
        // this.x = Math.max(0, Math.min(GAME_WIDTH, this.x));
        // this.y = Math.max(0, Math.min(GAME_HEIGHT, this.y));


        // --- 2. Auto-Aim & Shooting ---

        // --- 2. Auto-Aim & Shooting ---
        // DEPRECATED: Shooting is now handled by EvolutionManager -> WeaponBase
        // We only update animation state here if needed trigger exists?
        // Actually, WeaponBase firing should ideally trigger animation?
        // For now, let's keep attackTimer manageable by external calls or just simple "isAttacking" flag?
        // If EvolutionManager fires, it's hard to sync animation perfectly without event.
        // Let's assume player is always in "combat stance" or use a simple timer if we want.
        // For Swarm games, character often just walks and shoots automatically.
        // Let's keep the animation logic simple: if enemies are close, maybe show attack anim?
        // Or just remove the explicit attack state for now and simplify to walk/idle.

        // If we want to keep the "throw" animation when shooting, the Weapon should call `player.triggerAttack()`.


        // Animation State
        if (this.attackTimer > 0) {
            this.attackTimer -= deltaTime;
            this.state = this.isMoving ? 'walkAttack' : 'throw';
        } else {
            this.state = this.isMoving ? 'walk' : 'idle';
        }
    },

    draw(ctx, deltaTime) {
        const currentSpriteDef = this.sprites[this.state];
        // Ensure image is loaded by checking init was called or just use ASSETS ref
        // We assigned ASSETS images in initSprites, so they are references
        const img = currentSpriteDef.img;

        this.maxFrames = currentSpriteDef.frames;

        if (img && img.complete && img.width > 0) {
            this.frameTimer += deltaTime;
            if (this.frameTimer > this.frameInterval) {
                this.currentFrame++;
                if (this.currentFrame >= this.maxFrames) this.currentFrame = 0;
                this.frameTimer = 0;
            }

            const cols = this.maxFrames;
            const rows = 1;
            const frameWidth = img.width / cols;
            const frameHeight = img.height / rows;
            const col = this.currentFrame % cols;
            const row = 0;
            const renderedSize = 64;

            ctx.save();
            ctx.translate(this.x, this.y);

            // Determine orientation
            if (this.velocity.x < 0) this.facingLeft = true;
            if (this.velocity.x > 0) this.facingLeft = false;

            if (this.facingLeft) {
                ctx.scale(-1, 1);
            }

            ctx.drawImage(
                img,
                col * frameWidth, row * frameHeight, frameWidth, frameHeight,
                -renderedSize / 2, -renderedSize / 2, // Centered
                renderedSize, renderedSize
            );
            ctx.restore();
        } else {
            ctx.fillStyle = '#eb4034';
            ctx.fillRect(this.x - 16, this.y - 16, 32, 32);
        }

        // Draw Health Bar (World Space, below player)
        const barW = 40;
        const barH = 5;
        const hpPct = this.stats.currentHealth / this.stats.maxHealth;

        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - barW / 2, this.y + 20, barW, barH);

        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x - barW / 2, this.y + 20, barW * hpPct, barH);
    }
};
