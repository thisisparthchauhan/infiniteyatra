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
var InvestorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const schedule_1 = require("@nestjs/schedule");
const prisma = new client_1.PrismaClient();
let InvestorService = InvestorService_1 = class InvestorService {
    constructor() {
        this.logger = new common_1.Logger(InvestorService_1.name);
    }
    async captureGrowthSnapshot() {
        this.logger.log('Capturing Investor Growth Snapshot...');
        const revenue = await prisma.booking.aggregate({
            _sum: { totalAmount: true },
            where: { status: 'CONFIRMED' }
        });
        const users = await prisma.user.count();
        const bookings = await prisma.booking.count({ where: { status: 'CONFIRMED' } });
        const cac = 500;
        const ltv = Number(revenue._sum.totalAmount || 0) / Math.max(1, users);
        const snapshot = await prisma.growthSnapshot.create({
            data: {
                totalRevenue: revenue._sum.totalAmount || 0,
                totalBookings: bookings,
                activeUsers: users,
                burnRate: 50000,
                runwayMonths: 18,
                cac,
                ltv
            }
        });
        await this.generateNarrative(snapshot);
        return snapshot;
    }
    async generateNarrative(snapshot) {
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
            }
            else {
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
};
exports.InvestorService = InvestorService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvestorService.prototype, "captureGrowthSnapshot", null);
exports.InvestorService = InvestorService = InvestorService_1 = __decorate([
    (0, common_1.Injectable)()
], InvestorService);
//# sourceMappingURL=investor.service.js.map