import { AutoPricingService } from './auto-pricing.service';
export declare class AutoPricingController {
    private readonly autoPricingService;
    constructor(autoPricingService: AutoPricingService);
    setMode(body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        departureId: string;
        mode: string;
        lastCheck: Date | null;
        lastChange: Date | null;
    }>;
    setGuardrails(body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        departureId: string;
        minPrice: import("@prisma/client/runtime/library").Decimal;
        maxPrice: import("@prisma/client/runtime/library").Decimal;
        maxChangePercent: import("@prisma/client/runtime/library").Decimal;
        minMargin: import("@prisma/client/runtime/library").Decimal;
    }>;
    evaluate(id: string): Promise<void>;
}
