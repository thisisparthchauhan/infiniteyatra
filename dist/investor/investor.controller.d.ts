import { InvestorService } from './investor.service';
export declare class InvestorController {
    private readonly investorService;
    constructor(investorService: InvestorService);
    getDashboard(): Promise<{
        kpis: {
            id: string;
            ltv: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            totalRevenue: import("@prisma/client/runtime/library").Decimal;
            date: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            totalBookings: number;
            activeUsers: number;
            burnRate: import("@prisma/client/runtime/library").Decimal;
            runwayMonths: import("@prisma/client/runtime/library").Decimal;
            cac: import("@prisma/client/runtime/library").Decimal;
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
        ltv: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        totalRevenue: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        totalBookings: number;
        activeUsers: number;
        burnRate: import("@prisma/client/runtime/library").Decimal;
        runwayMonths: import("@prisma/client/runtime/library").Decimal;
        cac: import("@prisma/client/runtime/library").Decimal;
    }>;
}
