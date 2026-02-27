import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { CostService } from './cost.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('cost')
export class CostController {
    constructor(private readonly costService: CostService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('entry')
    async addCost(@Body() body) {
        return this.costService.addCost(body.departureId, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('analysis/:departureId')
    async analyze(@Param('departureId') id: string) {
        return this.costService.calculateTripFinancials(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('snapshot/:departureId')
    async snapshot(@Param('departureId') id: string) {
        return this.costService.captureSnapshot(id);
    }
}
