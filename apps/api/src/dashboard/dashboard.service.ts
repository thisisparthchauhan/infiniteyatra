import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
import { PricingService } from '../pricing/pricing.service';

const prisma = new PrismaClient();

@Injectable()
export class DashboardService {
    constructor(private readonly pricingService: PricingService) { }

    // Real-time Metrics (Aggregated)
    async getOverview() {
        const totalRevenue = await this.calculateTotalRevenue();
        const utilization = await this.calculateFleetUtilization();
        const recentActivity = await this.getRecentActivity();
        const aiInsights = await this.generateAIInsights(); // Use real engine

        return {
            totalRevenue,
            utilization,
            recentActivity,
            aiInsights,
        };
    }

    private async calculateTotalRevenue() {
        const result = await prisma.booking.aggregate({
            _sum: { totalAmount: true },
            where: { status: 'CONFIRMED' },
        });
        return result._sum.totalAmount || 0;
    }

    private async calculateFleetUtilization() {
        // Formula: (Total Booked / Total Capacity) * 100
        const trips = await prisma.departure.findMany();
        let totalCapacity = 0;
        let totalBooked = 0;

        trips.forEach(trip => {
            totalCapacity += trip.totalSeats;
            totalBooked += (trip.totalSeats - trip.availableSeats);
        });

        const percentage = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;

        return {
            percentage: parseFloat(percentage.toFixed(1)),
            totalCapacity,
            totalBooked
        };
    }

    private async getRecentActivity() {
        return prisma.booking.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: true, departure: { include: { package: true } } },
        });
    }

    private async generateAIInsights() {
        // Fetch active decisions from Pricing Engine
        // In a real scenario, we might aggregate this per departure or show the most significant ones.
        const recentDecisions = await prisma.pricingDecision.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { departure: { include: { package: true } } }
        });

        return recentDecisions.map(d => ({
            type: 'PRICING_OPTIMIZATION',
            departure: d.departure.package.title,
            action: d.newPrice > d.originalPrice ? 'INCREASE' : 'DECREASE',
            reason: d.reason,
            confidence: d.confidence
        }));
    }

    @OnEvent('booking.confirmed')
    async handleBookingConfirmed(payload: any) {
        console.log('Real-time Dashboard Update Triggered via Event:', payload.bookingId);

        // Trigger Pricing Recalculation for the specific departure
        const booking = await prisma.booking.findUnique({ where: { id: payload.bookingId } });
        if (booking) {
            await this.pricingService.calculatePrice(booking.departureId);
        }
    }
}
