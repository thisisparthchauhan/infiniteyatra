export declare class InvestorService {
    private readonly logger;
    captureGrowthSnapshot(): Promise<{
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
    generateNarrative(snapshot: any): Promise<void>;
    getDashboardData(): Promise<{
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
}
