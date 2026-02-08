import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { BookingModule } from './booking/booking.module';
import { InventoryModule } from './inventory/inventory.module';
import { CostModule } from './cost/cost.module';
import { FinanceModule } from './finance/finance.module';
import { ForecastModule } from './forecast/forecast.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PricingModule } from './pricing/pricing.module';
import { AutoPricingModule } from './auto-pricing/auto-pricing.module';
import { OperationsModule } from './operations/operations.module';
import { InvestorModule } from './investor/investor.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from './redis/redis.module';
import { HotelsModule } from './hotels/hotels.module';
import { HotelBookingsModule } from './hotel-bookings/hotel-bookings.module';

@Module({
    imports: [
        EventEmitterModule.forRoot(),
        AuthModule,
        CatalogModule,
        BookingModule,
        InventoryModule,
        CostModule,
        FinanceModule,
        ForecastModule,
        DashboardModule,
        PricingModule,
        AutoPricingModule,
        OperationsModule,
        InvestorModule,
        RedisModule,
        HotelsModule,
        HotelBookingsModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
