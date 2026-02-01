import { Module } from '@nestjs/common';
import { ForecastService } from './forecast.service';
import { ForecastController } from './forecast.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [ScheduleModule.forRoot()],
    controllers: [ForecastController],
    providers: [ForecastService],
    exports: [ForecastService],
})
export class ForecastModule { }
