import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { PricingEngine } from './pricing.engine';

@Module({
    controllers: [PricingController],
    providers: [PricingService, PricingEngine],
    exports: [PricingService],
})
export class PricingModule { }
