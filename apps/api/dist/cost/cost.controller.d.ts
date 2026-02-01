import { CostService } from './cost.service';
export declare class CostController {
    private readonly costService;
    constructor(costService: CostService);
    addCost(body: any): Promise<{
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
