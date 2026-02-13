"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AutoPricingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoPricingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const schedule_1 = require("@nestjs/schedule");
const forecast_service_1 = require("../forecast/forecast.service");
const cost_service_1 = require("../cost/cost.service");
const inventory_service_1 = require("../inventory/inventory.service");
const prisma = new client_1.PrismaClient();
let AutoPricingService = AutoPricingService_1 = class AutoPricingService {
    constructor(forecastService, costService, inventoryService) {
        this.forecastService = forecastService;
        this.costService = costService;
        this.inventoryService = inventoryService;
        this.logger = new common_1.Logger(AutoPricingService_1.name);
    }
    async evaluateActiveDepartures() {
        this.logger.log('Starting Auto-Pricing Evaluation...');
        const activeStates = await prisma.automationState.findMany({
            where: { isActive: true, mode: { in: ['ADVISORY', 'AUTO'] } },
            include: { departure: true }
        });
        for (const state of activeStates) {
            await this.calculatePriceAdjustment(state.departureId, state.mode);
        }
    }
    async calculatePriceAdjustment(departureId, mode) {
        const forecast = await this.forecastService.generateForecast(departureId);
        const financials = await this.costService.calculateTripFinancials(departureId);
        const inventory = await this.inventoryService.getInventoryStatus(departureId);
        const guardrail = await prisma.pricingGuardrail.findUnique({ where: { departureId } });
        if (!guardrail) {
            this.logger.warn(`No guardrails for ${departureId}, skipping.`);
            return;
        }
        const currentPrice = Number(financials.totalRevenue) / Math.max(1, financials.occupancy);
        const departure = await prisma.departure.findUnique({ where: { id: departureId } });
        const sellingPrice = Number(departure.priceOverride || departure.costOverride || 0);
        let action = 'HOLD';
        let suggestedPrice = sellingPrice;
        let reason = 'Stable conditions';
        if (forecast.risk === 'OVERSOLD' || forecast.velocity > 5) {
            action = 'INCREASE';
            suggestedPrice = sellingPrice * 1.05;
            reason = 'High Forecasted Demand';
        }
        else if (forecast.risk === 'UNDER_UTILIZED' && inventory.availableSeats > inventory.totalSeats * 0.5) {
            action = 'DECREASE';
            suggestedPrice = sellingPrice * 0.95;
            reason = 'Stimulate Demand (Low Utilization)';
        }
        if (suggestedPrice < Number(guardrail.minPrice))
            suggestedPrice = Number(guardrail.minPrice);
        if (suggestedPrice > Number(guardrail.maxPrice))
            suggestedPrice = Number(guardrail.maxPrice);
        const minSafePrice = financials.breakEvenPrice * (1 + Number(guardrail.minMargin) / 100);
        if (suggestedPrice < minSafePrice) {
            suggestedPrice = minSafePrice;
            reason += ' (Floored by Cost Safety)';
        }
        const changePercent = ((suggestedPrice - sellingPrice) / sellingPrice) * 100;
        if (Math.abs(changePercent) > 0.1) {
            const isApplied = (mode === 'AUTO');
            if (isApplied) {
                await prisma.departure.update({
                    where: { id: departureId },
                    data: { priceOverride: suggestedPrice }
                });
            }
            await prisma.priceAdjustmentLog.create({
                data: {
                    departureId,
                    oldPrice: sellingPrice,
                    newPrice: suggestedPrice,
                    changePercent,
                    trigger: reason,
                    action,
                    confidence: 0.9,
                    isApplied
                }
            });
            this.logger.log(`Price Adjustment (${mode}): ${departureId} ${sellingPrice} -> ${suggestedPrice} (${reason})`);
        }
    }
    async setAutomationMode(departureId, mode) {
        return prisma.automationState.upsert({
            where: { departureId },
            update: { mode, isActive: true },
            create: { departureId, mode, isActive: true }
        });
    }
    async setGuardrails(departureId, config) {
        return prisma.pricingGuardrail.upsert({
            where: { departureId },
            update: {
                minPrice: config.minPrice,
                maxPrice: config.maxPrice,
                minMargin: config.minMargin
            },
            create: {
                departureId,
                minPrice: config.minPrice,
                maxPrice: config.maxPrice,
                minMargin: config.minMargin
            }
        });
    }
};
exports.AutoPricingService = AutoPricingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AutoPricingService.prototype, "evaluateActiveDepartures", null);
exports.AutoPricingService = AutoPricingService = AutoPricingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [forecast_service_1.ForecastService,
        cost_service_1.CostService,
        inventory_service_1.InventoryService])
], AutoPricingService);
//# sourceMappingURL=auto-pricing.service.js.map