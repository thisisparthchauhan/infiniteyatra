import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('overview')
    async getOverview() {
        return this.dashboardService.getOverview();
    }
}
