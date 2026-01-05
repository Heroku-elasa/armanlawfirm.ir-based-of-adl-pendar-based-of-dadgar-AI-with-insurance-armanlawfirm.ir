
// Fast Cache Module
// A lightweight, persistent LRU-like cache for API responses to improve performance.

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

const CACHE_PREFIX = 'dadgar-fast-cache-';
const DEFAULT_TTL = 1000 * 60 * 60 * 24; // 24 hours default

export class FastCache {
    private static isEnabled = true;

    static setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        if (!enabled) {
            // Optionally clear cache or just stop reading
            console.log('Fast Cache Disabled');
        }
    }

    static async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
        if (!this.isEnabled) return;
        
        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                ttl
            };
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
            
            // Pruning: If storage is getting full (naive check), clear old entries
            // For a production app, we'd use IndexedDB, but LocalStorage is fine for simple JSON text data.
        } catch (e) {
            console.warn('FastCache set failed (likely quota exceeded):', e);
            this.prune();
        }
    }

    static async get<T>(key: string): Promise<T | null> {
        if (!this.isEnabled) return null;

        try {
            const item = localStorage.getItem(CACHE_PREFIX + key);
            if (!item) return null;

            const entry: CacheEntry<T> = JSON.parse(item);
            
            if (Date.now() - entry.timestamp > entry.ttl) {
                localStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }

            console.debug(`[FastCache] Hit for ${key}`);
            return entry.data;
        } catch (e) {
            console.error('FastCache get failed:', e);
            return null;
        }
    }

    static clear(): void {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }

    private static prune(): void {
        // Simple pruning strategy: remove oldest 50% of entries
        const entries: { key: string, timestamp: number }[] = [];
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const item = JSON.parse(localStorage.getItem(key) || '{}');
                    if (item.timestamp) {
                        entries.push({ key, timestamp: item.timestamp });
                    }
                } catch (e) {
                    localStorage.removeItem(key); // Corrupt
                }
            }
        });

        entries.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = entries.slice(0, Math.ceil(entries.length / 2));
        toRemove.forEach(e => localStorage.removeItem(e.key));
    }
}
