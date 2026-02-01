import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

const prisma = new PrismaClient();

@Injectable()
export class ForecastService {
    private readonly logger = new Logger(ForecastService.name);

    // 1. FEATURE PIPELINE (Run Daily)
    // captures the state of every active departure to build a time-series dataset
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async captureDailySignals() {
        this.logger.log('Starting Daily Demand Signal Capture...');
        const activeDepartures = await prisma.departure.findMany({
            where: { startDate: { gt: new Date() } }
        });

        for (const dep of activeDepartures) {
            const bookings = await prisma.booking.count({
                where: { departureId: dep.id, status: 'CONFIRMED' }
            });

            // Simple velocity: bookings made in last 24h
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const recentBookings = await prisma.booking.count({
                where: {
                    departureId: dep.id,
                    status: 'CONFIRMED',
                    createdAt: { gte: yesterday }
                }
            });

            const daysToDeparture = Math.ceil((dep.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            await prisma.demandSignal.create({
                data: {
                    departureId: dep.id,
                    bookedSeats: bookings,
                    totalSeats: dep.totalSeats,
                    daysToDeparture,
                    price: dep.priceOverride || 0, // In real app, fetch actual active price
                    bookingVelocity: recentBookings
                }
            }).catch(e => this.logger.warn(`Signal already exists for ${dep.id} today`));
        }
        this.logger.log('Daily Signals Captured.');
    }

    // 2. INFERENCE ENGINE (Phase 1: Simple Heuristic)
    async generateForecast(departureId: string) {
        const signals = await prisma.demandSignal.findMany({
            where: { departureId },
            orderBy: { date: 'asc' }
        });

        if (signals.length < 3) return { prediction: 0, confidence: 0, risk: 'UNKNOWN' };

        // Simple Logic: Average Velocity * Remaining Days
        const recentSignals = signals.slice(-5);
        const avgVelocity = recentSignals.reduce((sum, s) => sum + Number(s.bookingVelocity), 0) / recentSignals.length;

        const lastSignal = recentSignals[recentSignals.length - 1];
        const projectedDemand = Math.round(avgVelocity * lastSignal.daysToDeparture);
        const finalBooked = lastSignal.bookedSeats + projectedDemand;

        // Risk Logic
        let risk = 'LOW';
        if (finalBooked > lastSignal.totalSeats) risk = 'OVERSOLD';
        else if (finalBooked < lastSignal.totalSeats * 0.5) risk = 'UNDER_UTILIZED';
        else risk = 'OPTIMAL';

        // Save Forecast
        await prisma.forecastSnapshot.create({
            data: {
                departureId,
                targetDate: new Date(), // Just for v1 schema compliance
                predictedDemand: finalBooked,
                confidenceScore: 0.7, // Static for Phase 1
                riskLevel: risk,
                algorithm: 'MOVING_AVG_V1'
            }
        });

        return {
            predictedFinalBooked: finalBooked,
            velocity: avgVelocity,
            risk
        };
    }
}
