import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ForecastService } from '../forecast/forecast.service';
import { CostService } from '../cost/cost.service';
import { InventoryService } from '../inventory/inventory.service';

const prisma = new PrismaClient();

@Injectable()
export class AutoPricingService {
    private readonly logger = new Logger(AutoPricingService.name);

    constructor(
        private forecastService: ForecastService,
        private costService: CostService,
        private inventoryService: InventoryService
    ) { }

    // 1. EVALUATION CYCLE (Runs periodically)
    @Cron(CronExpression.EVERY_HOUR)
    async evaluateActiveDepartures() {
        this.logger.log('Starting Auto-Pricing Evaluation...');

        // Fetch departures with Automation enabled
        const activeStates = await prisma.automationState.findMany({
            where: { isActive: true, mode: { in: ['ADVISORY', 'AUTO'] } },
            include: { departure: true }
        });

        for (const state of activeStates) {
            await this.calculatePriceAdjustment(state.departureId, state.mode);
        }
    }

    // 2. CORE PRICING LOGIC
    async calculatePriceAdjustment(departureId: string, mode: string) {
        // A. GATHER SIGNALS
        const forecast = await this.forecastService.generateForecast(departureId); // Rerun inference or fetch latest
        const financials = await this.costService.calculateTripFinancials(departureId);
        const inventory = await this.inventoryService.getInventoryStatus(departureId);

        // B. FETCH GUARDRAILS
        const guardrail = await prisma.pricingGuardrail.findUnique({ where: { departureId } });
        if (!guardrail) {
            this.logger.warn(`No guardrails for ${departureId}, skipping.`);
            return;
        }

        const currentPrice = Number(financials.totalRevenue) / Math.max(1, financials.occupancy); // Approx current avg price or get from departure
        // Ideally departure.priceOverride is the current selling price.
        const departure = await prisma.departure.findUnique({ where: { id: departureId } });
        const sellingPrice = Number(departure.priceOverride || departure.costOverride || 0);

        // C. DETERMINE ACTION
        let action = 'HOLD';
        let suggestedPrice = sellingPrice;
        let reason = 'Stable conditions';

        // LOGIC: High Demand + High Velocity -> Increase Price
        if (forecast.risk === 'OVERSOLD' || forecast.velocity > 5) {
            action = 'INCREASE';
            suggestedPrice = sellingPrice * 1.05; // +5%
            reason = 'High Forecasted Demand';
        }
        // LOGIC: Low Utilization + Low Velocity + Close to Date -> Decrease Price
        else if (forecast.risk === 'UNDER_UTILIZED' && inventory.availableSeats > inventory.totalSeats * 0.5) {
            action = 'DECREASE';
            suggestedPrice = sellingPrice * 0.95; // -5%
            reason = 'Stimulate Demand (Low Utilization)';
        }

        // D. APPLY GUARDRAILS (The Safety Net)
        // 1. Min/Max check
        if (suggestedPrice < Number(guardrail.minPrice)) suggestedPrice = Number(guardrail.minPrice);
        if (suggestedPrice > Number(guardrail.maxPrice)) suggestedPrice = Number(guardrail.maxPrice);

        // 2. Cost Floor Check (Never sell below Cost + Min Margin)
        // costService.calculateTripFinancials gives us breakEvenPrice
        const minSafePrice = financials.breakEvenPrice * (1 + Number(guardrail.minMargin) / 100);
        if (suggestedPrice < minSafePrice) {
            suggestedPrice = minSafePrice;
            reason += ' (Floored by Cost Safety)';
        }

        // E. EXECUTE OR ADVISE
        const changePercent = ((suggestedPrice - sellingPrice) / sellingPrice) * 100;

        // Only log if there's a meaningful change
        if (Math.abs(changePercent) > 0.1) {
            const isApplied = (mode === 'AUTO');

            if (isApplied) {
                await prisma.departure.update({
                    where: { id: departureId },
                    data: { priceOverride: suggestedPrice }
                });
            }

            // Create Audit Log
            await prisma.priceAdjustmentLog.create({
                data: {
                    departureId,
                    oldPrice: sellingPrice,
                    newPrice: suggestedPrice,
                    changePercent,
                    trigger: reason,
                    action,
                    confidence: 0.9, // Placeholder for ML confidence
                    isApplied
                }
            });

            this.logger.log(`Price Adjustment (${mode}): ${departureId} ${sellingPrice} -> ${suggestedPrice} (${reason})`);
        }
    }

    // 3. API: TOGGLE AUTOMATION
    async setAutomationMode(departureId: string, mode: string) {
        return prisma.automationState.upsert({
            where: { departureId },
            update: { mode, isActive: true },
            create: { departureId, mode, isActive: true }
        });
    }

    // 4. API: CONFIGURE GUARDRAILS
    async setGuardrails(departureId: string, config: any) {
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
}
