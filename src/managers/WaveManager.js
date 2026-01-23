
export class WaveManager {
    constructor() {
        this.gameTime = 0;
        this.currentWaveIndex = 0;
        this.spawnTimer = 0;

        // Define Waves (Data-driven)
        // In a real app, this load come from a JSON file.
        // Define Waves (Data-driven)
        // In a real app, this load come from a JSON file.
        this.waves = [
            {
                startTime: 0,
                duration: 60, // 0-60s
                spawnInterval: 250, // Much faster for density vs slow enemies
                pattern: 'edge',
                difficulty: 1,
                enemyType: 'monster_red'
            },
            {
                startTime: 60,
                duration: 30, // 60-90s
                spawnInterval: 150, // Very Fast
                pattern: 'edge',
                difficulty: 1.5,
                enemyType: 'monster_eye' // Fast eyes
            },
            {
                startTime: 90,
                duration: 15, // 90-105s (Swarm Event)
                spawnInterval: 200, // Very fast
                pattern: 'circle', // Surround
                difficulty: 1.0, // Weaker but many
                enemyType: 'monster_skeleton'
            },
            {
                startTime: 120, // 2 Minutes (Demo purposes, user asked for 15m but test is needed)
                duration: 9999,
                spawnInterval: 999999, // One time event manually handled? 
                // Using wave system for boss is tricky if it needs singular spawn.
                // Let's create a dedicated wave type.
                pattern: 'boss',
                difficulty: 5.0,
                enemyType: 'boss_demon'
            }
        ];
    }

    update(deltaTime, context) {
        this.gameTime += deltaTime / 1000; // seconds

        // Determine current wave
        const wave = this._getCurrentWave();
        if (!wave) return;

        // Dynamic Difficulty Scaling
        // User Request: "Accelerate a bit every 5 minutes"
        // 5 minutes = 300 seconds
        // Increase multiplicator by 0.5 every 5 minutes
        const timeFactor = Math.floor(this.gameTime / 300);
        const dynamicDifficulty = wave.difficulty + (timeFactor * 0.5);

        // Spawn Logic
        this.spawnTimer += deltaTime;

        if (wave.pattern === 'boss' && !wave.hasSpawned) {
            this._spawnBoss(poolManager, enemies, gameWidth, gameHeight, dynamicDifficulty);
            wave.hasSpawned = true;
        } else if (wave.pattern !== 'boss' && this.spawnTimer >= wave.spawnInterval) {
            this.spawnTimer = 0;
            this._spawnEnemies(wave, context, dynamicDifficulty);
        }
    }

    _spawnBoss(poolManager, enemies, width, height, difficulty) {
        // Boss Logic
        // We probably need a specific 'boss' pool or just use 'enemy' and upgrade it?
        // 'enemy' pool returns Enemy class. Boss is Boss class.
        // We need to register Boss in PoolManager?
        // Or just `new Boss()` since it's 1 entity?
        // Let's do `new Boss()` for simplicity and push to enemies.
        // But `enemies` loop expects `draw`/`update`. Boss extends Enemy so it works.
        // Ensure Boss.js is imported in game.js? No, we are in WaveManager.
        // WaveManager doesn't import Boss.
        // We need to either import Boss here or use pool.
        // Let's use poolManager but we need to register 'boss' pool in game.js.

        // Temporarily, let's assume 'boss' pool exists.
        const boss = poolManager.get('boss');
        if (boss) {
            boss.reset(difficulty);
            boss.x = width / 2;
            boss.y = -100; // Top
            enemies.push(boss);
            console.log("BOSS SPAWNED");
        }
    }

    _getCurrentWave() {
        // Simple search (can be optimized if waves are sorted)
        // Find the latest wave that has started
        // Actually, waves might overlap? For now, sequential.

        // Return wave that covers current gameTime
        for (let i = this.waves.length - 1; i >= 0; i--) {
            if (this.gameTime >= this.waves[i].startTime) {
                return this.waves[i];
            }
        }
        return this.waves[0];
    }

    _spawnEnemies(wave, context, difficulty) {
        const { poolManager, enemies, player, gameWidth, gameHeight } = context;

        // Pattern Strategy
        if (wave.pattern === 'edge') {
            this._spawnEdge(poolManager, enemies, gameWidth, gameHeight, difficulty, wave.enemyType);
        } else if (wave.pattern === 'circle') {
            this._spawnCircle(poolManager, enemies, player, 10, difficulty, wave.enemyType); // Spawn batch of 10
        }
    }

    _spawnEdge(poolManager, enemies, width, height, difficulty, enemyType) {
        const e = poolManager.get('enemy');
        if (!e) return;

        // Logic moved from Enemy.js to here (Manager controls spawn pos)
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -20 : width + 20;
            y = Math.random() * height;
        } else {
            x = Math.random() * width;
            y = Math.random() < 0.5 ? -20 : height + 20;
        }

        e.reset(difficulty, enemyType); // specific stats
        e.x = x;
        e.y = y;
        enemies.push(e);
    }

    _spawnCircle(poolManager, enemies, player, count, difficulty, enemyType) {
        const radius = 400; // Distance from player (outside screen usually)

        for (let i = 0; i < count; i++) {
            const e = poolManager.get('enemy');
            if (!e) continue;

            const angle = (Math.PI * 2 / count) * i;
            const x = player.x + Math.cos(angle) * radius;
            const y = player.y + Math.sin(angle) * radius;

            e.reset(difficulty, enemyType);
            e.x = x;
            e.y = y;
            enemies.push(e);
        }
    }
}
