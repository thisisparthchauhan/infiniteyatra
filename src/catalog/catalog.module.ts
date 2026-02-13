import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { PricingModule } from '../pricing/pricing.module';
import { CostModule } from '../cost/cost.module';
import { OperationsModule } from '../operations/operations.module';
import { ForecastModule } from '../forecast/forecast.module';

@Module({
    imports: [PricingModule, CostModule, OperationsModule, ForecastModule],
    controllers: [CatalogController],
    providers: [CatalogService],
    exports: [CatalogService], // Export for other modules to use
})
export class CatalogModule { }
