import { InventoryService } from '../inventory/inventory.service';
export declare class CostService {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    addCost(departureId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: string;
        departureId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        isEstimated: boolean;
        perUnitAmount: import("@prisma/client/runtime/library").Decimal | null;
        quantity: number | null;
        categoryId: string;
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
