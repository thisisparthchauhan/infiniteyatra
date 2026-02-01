import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';

const prisma = new PrismaClient();

@Injectable()
export class CostService {
    constructor(private readonly inventoryService: InventoryService) { }

    // 1. ADD COST ENTRY
    async addCost(departureId: string, data: any) {
        return prisma.tripCost.create({
            data: {
                departureId,
                categoryId: data.categoryId,
                amount: data.amount,
                type: data.type, // FIXED, VARIABLE
                perUnitAmount: data.perUnitAmount,
                description: data.description,
                isEstimated: data.isEstimated || false,
            },
        });
    }

    // 2. CALCULATE FINANCIALS (The core logic)
    async calculateTripFinancials(departureId: string) {
        const departure = await prisma.departure.findUnique({
            where: { id: departureId },
            include: { tripCosts: true, bookings: { where: { status: 'CONFIRMED' } } },
        });
        if (!departure) throw new NotFoundException('Departure not found');

        const totalSeats = departure.totalSeats;
        const bookedSeats = departure.totalSeats - departure.availableSeats;
        const confirmedRevenue = departure.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);

        let totalFixedCost = 0;
        let totalVariableCost = 0;

        departure.tripCosts.forEach(cost => {
            if (cost.type === 'FIXED') {
                totalFixedCost += Number(cost.amount);
            } else if (cost.type === 'VARIABLE' || cost.type === 'PER_PERSON') {
                // Variable cost is either explicitly set as total amount OR calculated based on units
                // If perUnitAmount is present, we recalculate based on booked seats
                if (cost.perUnitAmount) {
                    totalVariableCost += Number(cost.perUnitAmount) * bookedSeats;
                } else {
                    totalVariableCost += Number(cost.amount);
                }
            }
        });

        const totalCost = totalFixedCost + totalVariableCost;
        const grossProfit = confirmedRevenue - totalCost;
        const marginPercent = confirmedRevenue > 0 ? (grossProfit / confirmedRevenue) * 100 : 0;

        // Break Even Price Calculation
        // Minimum price to cover fixed costs at 100% occupancy + variable cost per person
        // OR: Minimum price to cover fixed costs at current occupancy? 
        // Usually: (Total Fixed / Total Seats) + Avg Variable Cost Per Seat
        const avgFixedPerSeat = totalSeats > 0 ? totalFixedCost / totalSeats : 0;
        const avgVariablePerSeat = bookedSeats > 0 ? totalVariableCost / bookedSeats : 0;
        // Note: avgVariablePerSeat might be misleading if we have literal per-person costs. 
        // Better to sum up all per-person unit costs from the cost table.

        // Let's refine variable per seat logic:
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

    // 3. TAKE SNAPSHOT (For audit & trends)
    async captureSnapshot(departureId: string) {
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
}
