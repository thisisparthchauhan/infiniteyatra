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
exports.CostService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const inventory_service_1 = require("../inventory/inventory.service");
const prisma = new client_1.PrismaClient();
let CostService = class CostService {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async addCost(departureId, data) {
        return prisma.tripCost.create({
            data: {
                departureId,
                categoryId: data.categoryId,
                amount: data.amount,
                type: data.type,
                perUnitAmount: data.perUnitAmount,
                description: data.description,
                isEstimated: data.isEstimated || false,
            },
        });
    }
    async calculateTripFinancials(departureId) {
        const departure = await prisma.departure.findUnique({
            where: { id: departureId },
            include: { tripCosts: true, bookings: { where: { status: 'CONFIRMED' } } },
        });
        if (!departure)
            throw new common_1.NotFoundException('Departure not found');
        const totalSeats = departure.totalSeats;
        const bookedSeats = departure.totalSeats - departure.availableSeats;
        const confirmedRevenue = departure.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
        let totalFixedCost = 0;
        let totalVariableCost = 0;
        departure.tripCosts.forEach(cost => {
            if (cost.type === 'FIXED') {
                totalFixedCost += Number(cost.amount);
            }
            else if (cost.type === 'VARIABLE' || cost.type === 'PER_PERSON') {
                if (cost.perUnitAmount) {
                    totalVariableCost += Number(cost.perUnitAmount) * bookedSeats;
                }
                else {
                    totalVariableCost += Number(cost.amount);
                }
            }
        });
        const totalCost = totalFixedCost + totalVariableCost;
        const grossProfit = confirmedRevenue - totalCost;
        const marginPercent = confirmedRevenue > 0 ? (grossProfit / confirmedRevenue) * 100 : 0;
        const avgFixedPerSeat = totalSeats > 0 ? totalFixedCost / totalSeats : 0;
        const avgVariablePerSeat = bookedSeats > 0 ? totalVariableCost / bookedSeats : 0;
        let unitVariableCost = 0;
        departure.tripCosts.forEach(cost => {
            if ((cost.type === 'VARIABLE' || cost.type === 'PER_PERSON') && cost.perUnitAmount) {
                unitVariableCost += Number(cost.perUnitAmount);
            }
        });
        const breakEvenPrice = avgFixedPerSeat + unitVariableCost;
        return {
            departureId,
            totalRevenue: confirmedRevenue,
            totalCost,
            breakdown: {
                fixed: totalFixedCost,
                variable: totalVariableCost,
            },
            grossProfit,
            marginPercent: parseFloat(marginPercent.toFixed(2)),
            breakEvenPrice: parseFloat(breakEvenPrice.toFixed(2)),
            occupancy: bookedSeats,
        };
    }
    async captureSnapshot(departureId) {
        const financials = await this.calculateTripFinancials(departureId);
        const departure = await prisma.departure.findUnique({ where: { id: departureId } });
        const bookedSeats = departure.totalSeats - departure.availableSeats;
        const occupancyRate = departure.totalSeats > 0 ? (bookedSeats / departure.totalSeats) * 100 : 0;
        return prisma.profitSnapshot.create({
            data: {
                departureId,
                totalRevenue: financials.totalRevenue,
                totalCost: financials.totalCost,
                grossProfit: financials.grossProfit,
                marginPercent: financials.marginPercent,
                breakEvenPrice: financials.breakEvenPrice,
                occupancyRate: parseFloat(occupancyRate.toFixed(2))
            }
        });
    }
};
exports.CostService = CostService;
exports.CostService = CostService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], CostService);
//# sourceMappingURL=cost.service.js.map