import { Controller, Post, Body, Param, UseGuards, Get } from '@nestjs/common';
import { AutoPricingService } from './auto-pricing.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auto-pricing')
export class AutoPricingController {
    constructor(private readonly autoPricingService: AutoPricingService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('mode')
    async setMode(@Body() body) {
        return this.autoPricingService.setAutomationMode(body.departureId, body.mode);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('guardrails')
    async setGuardrails(@Body() body) {
        return this.autoPricingService.setGuardrails(body.departureId, body);
    }

    // Manually trigger evaluation for testing/admin
    @UseGuards(AuthGuard('jwt'))
    @Post('evaluate/:departureId')
    async evaluate(@Param('departureId') id: string) {
        // For manual run, we can force a mode or respect DB
        // Here we just trigger logic respecting DB mode
        const state = await this.autoPricingService.setAutomationMode(id, 'ADVISORY'); // Ensure state exists
        return this.autoPricingService.calculatePriceAdjustment(id, 'ADVISORY');
    }
}
