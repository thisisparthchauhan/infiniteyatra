import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

// NOTE: using cache-manager-redis-store v2 (compatible with nestjs cache-manager)
// In a real app we might use ioredis directly for advanced locking patterns
export const RedisOptions: CacheModuleAsyncOptions = {
    useFactory: () => ({
        store: redisStore,
        host: 'localhost',
        port: 6379,
        ttl: 600, // Default 10 mins
    } as any),
};
