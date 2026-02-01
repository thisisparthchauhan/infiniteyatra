import { InventoryService } from '../inventory/inventory.service';
export declare class CostService {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    addCost(departureId: string, data: any): Promise<{
        id: string;
        departureId: string;
        categoryId: string;
        description: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        type: string;
        currency: string;
        isEstimated: boolean;
        perUnitAmount: import("@prisma/client/runtime/library").Decimal | null;
        quantity: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    calculateTripFinancials(departureId: string): Promise<{
        departureId: string;
        totalRevenue: number;
        totalCost: number;
        breakdown: {
            fixed: number;
            variable: number;
        };
        grossProfit: number;
        marginPercent: number;
        breakEvenPrice: number;
        occupancy: number;
    }>;
    captureSnapshot(departureId: string): Promise<{
        id: string;
        departureId: string;
        totalRevenue: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        grossProfit: import("@prisma/client/runtime/library").Decimal;
        marginPercent: import("@prisma/client/runtime/library").Decimal;
        breakEvenPrice: import("@prisma/client/runtime/library").Decimal;
        occupancyRate: import("@prisma/client/runtime/library").Decimal;
        snapshotDate: Date;
    }>;
}
