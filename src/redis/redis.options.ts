import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

// NOTE: using cache-manager-redis-store v2 (compatible with nestjs cache-manager)
// In a real app we might use ioredis directly for advanced locking patterns
export const RedisOptions: CacheModuleAsyncOptions = {
    useFactory: async () => {
        if (!process.env.REDIS_HOST) {
            console.log('Redis config not found. Using memory cache.');
            return {
                store: 'memory',
                ttl: 600,
            };
        }

        return {
            store: redisStore,
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379'),
            ttl: 600,
        };
    },
};
