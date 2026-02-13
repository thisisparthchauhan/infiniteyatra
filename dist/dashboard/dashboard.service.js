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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const event_emitter_1 = require("@nestjs/event-emitter");
const pricing_service_1 = require("../pricing/pricing.service");
const prisma = new client_1.PrismaClient();
let DashboardService = class DashboardService {
    constructor(pricingService) {
        this.pricingService = pricingService;
    }
    async getOverview() {
        const totalRevenue = await this.calculateTotalRevenue();
        const utilization = await this.calculateFleetUtilization();
        const recentActivity = await this.getRecentActivity();
        const aiInsights = await this.generateAIInsights();
        return {
            totalRevenue,
            utilization,
            recentActivity,
            aiInsights,
        };
    }
    async calculateTotalRevenue() {
        const result = await prisma.booking.aggregate({
            _sum: { totalAmount: true },
            where: { status: 'CONFIRMED' },
        });
        return result._sum.totalAmount || 0;
    }
    async calculateFleetUtilization() {
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
    async getRecentActivity() {
        return prisma.booking.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: true, departure: { include: { package: true } } },
        });
    }
    async generateAIInsights() {
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
    async handleBookingConfirmed(payload) {
        console.log('Real-time Dashboard Update Triggered via Event:', payload.bookingId);
        const booking = await prisma.booking.findUnique({ where: { id: payload.bookingId } });
        if (booking) {
            await this.pricingService.calculatePrice(booking.departureId);
        }
    }
};
exports.DashboardService = DashboardService;
__decorate([
    (0, event_emitter_1.OnEvent)('booking.confirmed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardService.prototype, "handleBookingConfirmed", null);
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pricing_service_1.PricingService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map