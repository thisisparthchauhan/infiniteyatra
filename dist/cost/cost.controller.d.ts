import { CostService } from './cost.service';
export declare class CostController {
    private readonly costService;
    constructor(costService: CostService);
    addCost(body: any): Promise<{
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
    analyze(id: string): Promise<{
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
    snapshot(id: string): Promise<{
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
