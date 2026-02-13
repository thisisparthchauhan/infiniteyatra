import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getStatus(id: string): Promise<{
        totalSeats: number;
        availableSeats: number;
        lockedSeats: number;
        realTimeAvailable: number;
    }>;
    reserve(body: any): Promise<{
        lockId: string;
        expiresAt: number;
    }>;
    release(body: any): Promise<boolean>;
}
