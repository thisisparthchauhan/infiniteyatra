import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PricingEngine, PricingSignals } from './pricing.engine';

const prisma = new PrismaClient();

@Injectable()
export class PricingService {
    constructor(private readonly engine: PricingEngine) { }

    async calculatePrice(departureId: string) {
        const departure = await prisma.departure.findUnique({
            where: { id: departureId },
            include: { package: true, bookings: true } // Need bookings to calc signals
        });

        if (!departure) throw new Error('Departure not found');

        // 1. Calculate Signals
        const bookedSeats = departure.totalSeats - departure.availableSeats;
        const utilization = (bookedSeats / departure.totalSeats) * 100;

        const now = new Date();
        const daysToDeparture = Math.max(0, Math.ceil((departure.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        // Velocity Placeholder (Needs more complex query in production)
        const bookingVelocity = 0.5;

        const signals: PricingSignals = {
            utilization,
            daysToDeparture,
            bookingVelocity,
            remainingSeats: departure.availableSeats
        };

        // 2. Fetch Active Rules
        const rules = await prisma.pricingRule.findMany({ where: { isActive: true } });

        // 3. Evaluate Rule Engine
        const decision = this.engine.evaluate(signals, rules, Number(departure.package.basePrice));

        // 4. Log Snapshot (for ML) and Decision
        const snapshot = await prisma.pricingSnapshot.create({
            data: {
                departureId,
                bookedSeats,
                totalSeats: departure.totalSeats,
                daysToDeparture,
                bookingVelocity,
                currentPrice: departure.priceOverride || departure.package.basePrice,
            }
        });

        const pricingDecision = await prisma.pricingDecision.create({
            data: {
                departureId,
                ruleId: decision.ruleId,
                originalPrice: departure.priceOverride || departure.package.basePrice,
                newPrice: decision.suggestedPrice,
                reason: decision.reason,
                snapshotId: snapshot.id,
                applied: false // Require admin approval for v1
            }
        });

        return {
            ...pricingDecision,
            signals
        };
    }

    async getStoredDecisions(departureId: string) {
        return prisma.pricingDecision.findMany({
            where: { departureId },
            orderBy: { createdAt: 'desc' },
            include: { rule: true }
        });
    }

    // Admin approves price
    async applyPrice(decisionId: string) {
        const decision = await prisma.pricingDecision.findUnique({ where: { id: decisionId } });
        if (!decision) throw new Error('Decision not found');

        await prisma.departure.update({
            where: { id: decision.departureId },
            data: { priceOverride: decision.newPrice }
        });

        return prisma.pricingDecision.update({
            where: { id: decisionId },
            data: { applied: true }
        });
    }
}
