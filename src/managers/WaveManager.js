
export class WaveManager {
    constructor() {
        this.gameTime = 0;
        this.currentWaveIndex = 0;
        this.spawnTimer = 0;

        // Define Waves (Data-driven)
        // In a real app, this load come from a JSON file.
        this.waves = [
            {
                startTime: 0,
                duration: 60, // 0-60s
                spawnInterval: 1000,
                pattern: 'edge',
                difficulty: 1,
                enemyType: 'basic'
            },
            {
                startTime: 60,
                duration: 30, // 60-90s
                spawnInterval: 500, // Faster
                pattern: 'edge',
                difficulty: 1.5,
                enemyType: 'basic'
            },
            {
                startTime: 90,
                duration: 15, // 90-105s (Swarm Event)
                spawnInterval: 200, // Very fast
                pattern: 'circle', // Surround
                difficulty: 1.0, // Weaker but many
                enemyType: 'basic'
            },
            {
                startTime: 105,
                duration: 9999, // Endless
                spawnInterval: 400,
                pattern: 'edge',
                difficulty: 2.0,
                enemyType: 'basic'
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
        // Decrease spawn interval as difficulty rises? Optional.
        // For now, just pass difficulty to enemy stats.
        if (this.spawnTimer >= wave.spawnInterval) {
            this.spawnTimer = 0;
            this._spawnEnemies(wave, context, dynamicDifficulty);
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
            this._spawnEdge(poolManager, enemies, gameWidth, gameHeight, difficulty);
        } else if (wave.pattern === 'circle') {
            this._spawnCircle(poolManager, enemies, player, 10, difficulty); // Spawn batch of 10
        }
    }

    _spawnEdge(poolManager, enemies, width, height, difficulty) {
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

        e.reset(difficulty); // specific stats
        e.x = x;
        e.y = y;
        enemies.push(e);
    }

    _spawnCircle(poolManager, enemies, player, count, difficulty) {
        const radius = 400; // Distance from player (outside screen usually)

        for (let i = 0; i < count; i++) {
            const e = poolManager.get('enemy');
            if (!e) continue;

            const angle = (Math.PI * 2 / count) * i;
            const x = player.x + Math.cos(angle) * radius;
            const y = player.y + Math.sin(angle) * radius;

            e.reset(difficulty);
            e.x = x;
            e.y = y;
            enemies.push(e);
        }
    }
}
