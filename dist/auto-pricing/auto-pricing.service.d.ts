import { ForecastService } from '../forecast/forecast.service';
import { CostService } from '../cost/cost.service';
import { InventoryService } from '../inventory/inventory.service';
export declare class AutoPricingService {
    private forecastService;
    private costService;
    private inventoryService;
    private readonly logger;
    constructor(forecastService: ForecastService, costService: CostService, inventoryService: InventoryService);
    evaluateActiveDepartures(): Promise<void>;
    calculatePriceAdjustment(departureId: string, mode: string): Promise<void>;
    setAutomationMode(departureId: string, mode: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        departureId: string;
        mode: string;
        lastCheck: Date | null;
        lastChange: Date | null;
    }>;
    setGuardrails(departureId: string, config: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        departureId: string;
        minPrice: import("@prisma/client/runtime/library").Decimal;
        maxPrice: import("@prisma/client/runtime/library").Decimal;
        maxChangePercent: import("@prisma/client/runtime/library").Decimal;
        minMargin: import("@prisma/client/runtime/library").Decimal;
    }>;
}
