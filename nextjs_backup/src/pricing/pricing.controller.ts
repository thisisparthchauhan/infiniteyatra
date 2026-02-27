import { Controller, Get, Post, Param, UseGuards, Body } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('pricing')
export class PricingController {
    constructor(private readonly pricingService: PricingService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('analyze/:departureId')
    async analyzeDeparture(@Param('departureId') id: string) {
        return this.pricingService.calculatePrice(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('apply/:decisionId')
    async applyPrice(@Param('decisionId') id: string) {
        return this.pricingService.applyPrice(id);
    }
}
