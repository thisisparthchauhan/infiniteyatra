"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./auth/auth.module");
const catalog_module_1 = require("./catalog/catalog.module");
const booking_module_1 = require("./booking/booking.module");
const inventory_module_1 = require("./inventory/inventory.module");
const cost_module_1 = require("./cost/cost.module");
const finance_module_1 = require("./finance/finance.module");
const forecast_module_1 = require("./forecast/forecast.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const pricing_module_1 = require("./pricing/pricing.module");
const auto_pricing_module_1 = require("./auto-pricing/auto-pricing.module");
const operations_module_1 = require("./operations/operations.module");
const investor_module_1 = require("./investor/investor.module");
const event_emitter_1 = require("@nestjs/event-emitter");
const redis_module_1 = require("./redis/redis.module");
const hotels_module_1 = require("./hotels/hotels.module");
const hotel_bookings_module_1 = require("./hotel-bookings/hotel-bookings.module");
const health_controller_1 = require("./health.controller");
const config_1 = require("@nestjs/config");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const prisma_module_1 = require("./prisma/prisma.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, "..", "legacy_backup", "dist"),
                exclude: ["/api/(.*)"],
            }),
            event_emitter_1.EventEmitterModule.forRoot(),
            auth_module_1.AuthModule,
            prisma_module_1.PrismaModule,
            catalog_module_1.CatalogModule,
            booking_module_1.BookingModule,
            inventory_module_1.InventoryModule,
            cost_module_1.CostModule,
            finance_module_1.FinanceModule,
            forecast_module_1.ForecastModule,
            dashboard_module_1.DashboardModule,
            pricing_module_1.PricingModule,
            auto_pricing_module_1.AutoPricingModule,
            operations_module_1.OperationsModule,
            investor_module_1.InvestorModule,
            redis_module_1.RedisModule,
            hotels_module_1.HotelsModule,
            hotel_bookings_module_1.HotelBookingsModule
        ],
        controllers: [health_controller_1.HealthController],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map