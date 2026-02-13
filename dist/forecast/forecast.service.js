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
var ForecastService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const schedule_1 = require("@nestjs/schedule");
const prisma = new client_1.PrismaClient();
let ForecastService = ForecastService_1 = class ForecastService {
    constructor() {
        this.logger = new common_1.Logger(ForecastService_1.name);
    }
    async captureDailySignals() {
        this.logger.log('Starting Daily Demand Signal Capture...');
        const activeDepartures = await prisma.departure.findMany({
            where: { startDate: { gt: new Date() } }
        });
        for (const dep of activeDepartures) {
            const bookings = await prisma.booking.count({
                where: { departureId: dep.id, status: 'CONFIRMED' }
            });
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
                    price: dep.priceOverride || 0,
                    bookingVelocity: recentBookings
                }
            }).catch(e => this.logger.warn(`Signal already exists for ${dep.id} today`));
        }
        this.logger.log('Daily Signals Captured.');
    }
    async generateForecast(departureId) {
        const signals = await prisma.demandSignal.findMany({
            where: { departureId },
            orderBy: { date: 'asc' }
        });
        if (signals.length < 3)
            return { prediction: 0, confidence: 0, risk: 'UNKNOWN' };
        const recentSignals = signals.slice(-5);
        const avgVelocity = recentSignals.reduce((sum, s) => sum + Number(s.bookingVelocity), 0) / recentSignals.length;
        const lastSignal = recentSignals[recentSignals.length - 1];
        const projectedDemand = Math.round(avgVelocity * lastSignal.daysToDeparture);
        const finalBooked = lastSignal.bookedSeats + projectedDemand;
        let risk = 'LOW';
        if (finalBooked > lastSignal.totalSeats)
            risk = 'OVERSOLD';
        else if (finalBooked < lastSignal.totalSeats * 0.5)
            risk = 'UNDER_UTILIZED';
        else
            risk = 'OPTIMAL';
        await prisma.forecastSnapshot.create({
            data: {
                departureId,
                targetDate: new Date(),
                predictedDemand: finalBooked,
                confidenceScore: 0.7,
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
};
exports.ForecastService = ForecastService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ForecastService.prototype, "captureDailySignals", null);
exports.ForecastService = ForecastService = ForecastService_1 = __decorate([
    (0, common_1.Injectable)()
], ForecastService);
//# sourceMappingURL=forecast.service.js.map