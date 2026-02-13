import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ForecastService } from './forecast.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('forecast')
export class ForecastController {
    constructor(private readonly forecastService: ForecastService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('predict/:departureId')
    async predict(@Param('departureId') id: string) {
        return this.forecastService.generateForecast(id);
    }

    // Trigger manual signal capture for testing
    @UseGuards(AuthGuard('jwt'))
    @Post('capture-signals')
    async capture() {
        return this.forecastService.captureDailySignals();
    }
}
