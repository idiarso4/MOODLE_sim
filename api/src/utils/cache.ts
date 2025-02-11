import { logger } from './logger';

// Temporary in-memory cache implementation
const cache = new Map<string, { value: string; expiresAt?: number }>();

export class Cache {
    static async get(key: string): Promise<string | null> {
        try {
            const item = cache.get(key);
            if (!item) return null;

            if (item.expiresAt && Date.now() > item.expiresAt) {
                cache.delete(key);
                return null;
            }

            return item.value;
        } catch (error) {
            logger.error('Cache Get Error:', error);
            return null;
        }
    }

    static async set(key: string, value: string, expiresIn?: number): Promise<void> {
        try {
            cache.set(key, {
                value,
                expiresAt: expiresIn ? Date.now() + (expiresIn * 1000) : undefined
            });
        } catch (error) {
            logger.error('Cache Set Error:', error);
        }
    }

    static async del(key: string): Promise<void> {
        try {
            cache.delete(key);
        } catch (error) {
            logger.error('Cache Delete Error:', error);
        }
    }

    static generateKey(...parts: string[]): string {
        return parts.join(':');
    }

    // Cleanup expired items periodically
    static startCleanup(intervalMs: number = 60000): ReturnType<typeof setInterval> {
        return setInterval(() => {
            const now = Date.now();
            for (const [key, item] of cache.entries()) {
                if (item.expiresAt && now > item.expiresAt) {
                    cache.delete(key);
                }
            }
        }, intervalMs);
    }
}
