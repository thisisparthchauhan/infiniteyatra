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
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pricing_engine_1 = require("./pricing.engine");
const prisma = new client_1.PrismaClient();
let PricingService = class PricingService {
    constructor(engine) {
        this.engine = engine;
    }
    async calculatePrice(departureId) {
        const departure = await prisma.departure.findUnique({
            where: { id: departureId },
            include: { package: true, bookings: true }
        });
        if (!departure)
            throw new Error('Departure not found');
        const bookedSeats = departure.totalSeats - departure.availableSeats;
        const utilization = (bookedSeats / departure.totalSeats) * 100;
        const now = new Date();
        const daysToDeparture = Math.max(0, Math.ceil((departure.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const bookingVelocity = 0.5;
        const signals = {
            utilization,
            daysToDeparture,
            bookingVelocity,
            remainingSeats: departure.availableSeats
        };
        const rules = await prisma.pricingRule.findMany({ where: { isActive: true } });
        const decision = this.engine.evaluate(signals, rules, Number(departure.package.basePrice));
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
                applied: false
            }
        });
        return Object.assign(Object.assign({}, pricingDecision), { signals });
    }
    async getStoredDecisions(departureId) {
        return prisma.pricingDecision.findMany({
            where: { departureId },
            orderBy: { createdAt: 'desc' },
            include: { rule: true }
        });
    }
    async applyPrice(decisionId) {
        const decision = await prisma.pricingDecision.findUnique({ where: { id: decisionId } });
        if (!decision)
            throw new Error('Decision not found');
        await prisma.departure.update({
            where: { id: decision.departureId },
            data: { priceOverride: decision.newPrice }
        });
        return prisma.pricingDecision.update({
            where: { id: decisionId },
            data: { applied: true }
        });
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pricing_engine_1.PricingEngine])
], PricingService);
//# sourceMappingURL=pricing.service.js.map