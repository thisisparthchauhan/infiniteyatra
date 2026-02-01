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
                role: import(".prisma/client").$Enums.Role;
                ltv: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
            departure: {
                package: {
                    id: string;
                    slug: string;
                    title: string;
                    description: string;
                    basePrice: import("@prisma/client/runtime/library").Decimal;
                    costPerSeat: import("@prisma/client/runtime/library").Decimal;
                    durationDays: number;
                    type: string;
                    mediaGallery: string[];
                    itinerary: import(".prisma/client").Prisma.JsonValue | null;
                    createdAt: Date;
                    updatedAt: Date;
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
            };
        } & {
            id: string;
            userId: string;
            departureId: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
            source: import(".prisma/client").$Enums.BookingSource;
            seatsBooked: number;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            amountPaid: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
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
