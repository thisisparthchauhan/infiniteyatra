import { Module } from '@nestjs/common';
import { AutoPricingService } from './auto-pricing.service';
import { AutoPricingController } from './auto-pricing.controller';
import { ForecastModule } from '../forecast/forecast.module';
import { CostModule } from '../cost/cost.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
    imports: [ForecastModule, CostModule, InventoryModule],
    controllers: [AutoPricingController],
    providers: [AutoPricingService],
    exports: [AutoPricingService],
})
export class AutoPricingModule { }
