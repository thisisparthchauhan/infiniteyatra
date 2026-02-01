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
        departureId: string;
        mode: string;
        lastCheck: Date | null;
        lastChange: Date | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    setGuardrails(departureId: string, config: any): Promise<{
        id: string;
        departureId: string;
        minPrice: import("@prisma/client/runtime/library").Decimal;
        maxPrice: import("@prisma/client/runtime/library").Decimal;
        maxChangePercent: import("@prisma/client/runtime/library").Decimal;
        minMargin: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
