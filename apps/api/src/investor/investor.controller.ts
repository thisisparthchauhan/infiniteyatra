import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { InvestorService } from './investor.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('investor')
export class InvestorController {
    constructor(private readonly investorService: InvestorService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('dashboard')
    async getDashboard() {
        return this.investorService.getDashboardData();
    }

    // Admin trigger for demo/testing
    @UseGuards(AuthGuard('jwt'))
    @Post('refresh-snapshot')
    async refresh() {
        return this.investorService.captureGrowthSnapshot();
    }
}
