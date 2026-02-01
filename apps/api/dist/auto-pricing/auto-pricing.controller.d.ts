import { AutoPricingService } from './auto-pricing.service';
export declare class AutoPricingController {
    private readonly autoPricingService;
    constructor(autoPricingService: AutoPricingService);
    setMode(body: any): Promise<{
        id: string;
        departureId: string;
        mode: string;
        lastCheck: Date | null;
        lastChange: Date | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    setGuardrails(body: any): Promise<{
        id: string;
        departureId: string;
        minPrice: import("@prisma/client/runtime/library").Decimal;
        maxPrice: import("@prisma/client/runtime/library").Decimal;
        maxChangePercent: import("@prisma/client/runtime/library").Decimal;
        minMargin: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    evaluate(id: string): Promise<void>;
}
