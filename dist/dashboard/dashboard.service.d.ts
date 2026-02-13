import { PricingService } from '../pricing/pricing.service';
export declare class DashboardService {
    private readonly pricingService;
    constructor(pricingService: PricingService);
    getOverview(): Promise<{
        totalRevenue: number | import("@prisma/client/runtime/library").Decimal;
        utilization: {
            percentage: number;
            totalCapacity: number;
            totalBooked: number;
        };
        recentActivity: ({
            user: {
                id: string;
                email: string;
                password: string;
                role: import(".prisma/client").$Enums.LegacyRole;
                ltv: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
            departure: {
                package: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string;
                    version: number;
                    healthScore: import("@prisma/client/runtime/library").Decimal;
                    slug: string;
                    title: string;
                    basePrice: import("@prisma/client/runtime/library").Decimal;
                    costPerSeat: import("@prisma/client/runtime/library").Decimal;
                    durationDays: number;
                    type: string;
                    mediaGallery: string[];
                    itinerary: import("@prisma/client/runtime/library").JsonValue | null;
                    requirements: import("@prisma/client/runtime/library").JsonValue | null;
                    costStructure: import("@prisma/client/runtime/library").JsonValue | null;
                };
            } & {
                id: string;
                packageId: string;
                startDate: Date;
                endDate: Date;
                totalSeats: number;
                availableSeats: number;
                costOverride: import("@prisma/client/runtime/library").Decimal | null;
                priceOverride: import("@prisma/client/runtime/library").Decimal | null;
                vehicleId: string | null;
                guideId: string | null;
                healthScore: import("@prisma/client/runtime/library").Decimal;
                opsStatus: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            departureId: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
            source: import(".prisma/client").$Enums.BookingSource;
            seatsBooked: number;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            amountPaid: import("@prisma/client/runtime/library").Decimal;
        })[];
        aiInsights: {
            type: string;
            departure: string;
            action: string;
            reason: string;
            confidence: import("@prisma/client/runtime/library").Decimal;
        }[];
    }>;
    private calculateTotalRevenue;
    private calculateFleetUtilization;
    private getRecentActivity;
    private generateAIInsights;
    handleBookingConfirmed(payload: any): Promise<void>;
}
