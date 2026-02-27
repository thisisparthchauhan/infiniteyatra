import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

const prisma = new PrismaClient();

@Injectable()
export class InvestorService {
    private readonly logger = new Logger(InvestorService.name);

    // 1. GENERATE DAILY SNAPSHOT
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async captureGrowthSnapshot() {
        this.logger.log('Capturing Investor Growth Snapshot...');

        // A. AGGREGATE REVENUE (Basic Sum of Confirmed Bookings)
        const revenue = await prisma.booking.aggregate({
            _sum: { totalAmount: true },
            where: { status: 'CONFIRMED' }
        });

        // B. COUNT USERS
        const users = await prisma.user.count();
        const bookings = await prisma.booking.count({ where: { status: 'CONFIRMED' } });

        // C. MOCK CAC/LTV (For V1 - In real app, calculate from spend/cohorts)
        const cac = 500; // Mock 500 INR
        const ltv = Number(revenue._sum.totalAmount || 0) / Math.max(1, users); // Simple LTV

        // Save Snapshot
        const snapshot = await prisma.growthSnapshot.create({
            data: {
                totalRevenue: revenue._sum.totalAmount || 0,
                totalBookings: bookings,
                activeUsers: users,
                burnRate: 50000, // Mock Monthly Burn
                runwayMonths: 18, // Mock Runway
                cac,
                ltv
            }
        });

        // Generate Narrative
        await this.generateNarrative(snapshot);

        return snapshot;
    }

    // 2. NARRATIVE ENGINE
    async generateNarrative(snapshot: any) {
        // Simple Rule-Based Storytelling
        const prevSnapshot = await prisma.growthSnapshot.findFirst({
            where: { date: { lt: new Date() } },
            orderBy: { date: 'desc' }
        });

        let story = `We reached ${snapshot.totalBookings} bookings and revenue of ${snapshot.totalRevenue}.`;
        let sentiment = 'NEUTRAL';

        if (prevSnapshot) {
            const growth = Number(snapshot.totalRevenue) - Number(prevSnapshot.totalRevenue);
            if (growth > 0) {
                story = `Revenue grew by ${growth} INR. Operational efficiency is improving as we scale.`;
                sentiment = 'POSITIVE';
            } else {
                story = `Revenue is stable. Focus is on optimization and cost reduction.`;
                sentiment = 'CAUTION';
            }
        }

        await prisma.narrativeBlock.create({
            data: {
                key: 'GROWTH_STORY',
                title: 'Daily Growth Update',
                content: story,
                sentiment
            }
        });
    }

    // 3. GET DATA FOR DASHBOARD
    async getDashboardData() {
        const latestSnapshot = await prisma.growthSnapshot.findFirst({ orderBy: { date: 'desc' } });
        const narratives = await prisma.narrativeBlock.findMany({
            orderBy: { generatedAt: 'desc' },
            take: 5
        });

        return {
            kpis: latestSnapshot,
            insights: narratives
        };
    }
}
