"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisOptions = void 0;
const redisStore = require("cache-manager-redis-store");
exports.RedisOptions = {
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
//# sourceMappingURL=redis.options.js.map