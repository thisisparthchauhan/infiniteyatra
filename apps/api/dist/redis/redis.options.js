"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisOptions = void 0;
const redisStore = require("cache-manager-redis-store");
exports.RedisOptions = {
    useFactory: () => ({
        store: redisStore,
        host: 'localhost',
        port: 6379,
        ttl: 600,
    }),
};
//# sourceMappingURL=redis.options.js.map