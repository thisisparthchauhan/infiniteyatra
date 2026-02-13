import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisOptions } from './redis.options';

@Global()
@Module({
    imports: [
        CacheModule.registerAsync(RedisOptions),
    ],
    exports: [CacheModule],
})
export class RedisModule { }
