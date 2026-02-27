import { Controller, Get, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('health')
    async getHealth() {
        return this.financeService.getFinancialHealth();
    }
}
