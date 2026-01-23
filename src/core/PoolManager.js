
export class PoolManager {
    constructor() {
        this.pools = new Map();
    }

    /**
     * Register a new pool for a specific type.
     * @param {string} type - Unique identifier (e.g., 'enemy', 'projectile')
     * @param {Function} factoryFn - Function that returns a new instance
     * @param {number} initialSize - How many items to pre-allocate
     */
    createPool(type, factoryFn, initialSize = 10) {
        if (this.pools.has(type)) {
            console.warn(`Pool for ${type} already exists.`);
            return;
        }

        const pool = {
            active: [],
            inactive: [],
            factory: factoryFn
        };

        for (let i = 0; i < initialSize; i++) {
            pool.inactive.push(factoryFn());
        }

        this.pools.set(type, pool);
    }

    /**
     * Get an object from the pool. If empty, creates a new one.
     * @param {string} type 
     * @returns {Object} The reused or new object
     */
    get(type) {
        const pool = this.pools.get(type);
        if (!pool) {
            throw new Error(`Pool ${type} not found!`);
        }

        let obj;
        if (pool.inactive.length > 0) {
            obj = pool.inactive.pop();
        } else {
            obj = pool.factory();
        }

        // We don't necessarily track 'active' list here if we loop main arrays differently,
        // but it's good practice or we can just return it.
        // For ECS style, we usually have a global active list. 
        // We'll leave management of the active list to the caller (Game loop).

        // However, if we want to ensure unique references:
        // pool.active.push(obj); 

        return obj;
    }

    /**
     * Return an object to the pool.
     * @param {string} type 
     * @param {Object} obj 
     */
    release(type, obj) {
        const pool = this.pools.get(type);
        if (!pool) return;

        // Reset object state if it has a reset method
        if (obj.reset && typeof obj.reset === 'function') {
            obj.reset();
        }

        pool.inactive.push(obj);
    }
}
