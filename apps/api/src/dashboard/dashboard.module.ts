import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PricingModule } from '../pricing/pricing.module';

@Module({
    imports: [PricingModule],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
