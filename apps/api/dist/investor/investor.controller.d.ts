import { InvestorService } from './investor.service';
export declare class InvestorController {
    private readonly investorService;
    constructor(investorService: InvestorService);
    getDashboard(): Promise<{
        kpis: {
            id: string;
            date: Date;
            totalRevenue: import("@prisma/client/runtime/library").Decimal;
            totalBookings: number;
            activeUsers: number;
            burnRate: import("@prisma/client/runtime/library").Decimal;
            runwayMonths: import("@prisma/client/runtime/library").Decimal;
            cac: import("@prisma/client/runtime/library").Decimal;
            ltv: import("@prisma/client/runtime/library").Decimal;
            metadata: import(".prisma/client").Prisma.JsonValue | null;
            createdAt: Date;
        };
        insights: {
            id: string;
            key: string;
            title: string;
            content: string;
            sentiment: string;
            generatedAt: Date;
            isPinned: boolean;
        }[];
    }>;
    refresh(): Promise<{
        id: string;
        date: Date;
        totalRevenue: import("@prisma/client/runtime/library").Decimal;
        totalBookings: number;
        activeUsers: number;
        burnRate: import("@prisma/client/runtime/library").Decimal;
        runwayMonths: import("@prisma/client/runtime/library").Decimal;
        cac: import("@prisma/client/runtime/library").Decimal;
        ltv: import("@prisma/client/runtime/library").Decimal;
        metadata: import(".prisma/client").Prisma.JsonValue | null;
        createdAt: Date;
    }>;
}
