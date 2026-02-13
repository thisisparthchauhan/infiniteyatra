import { Cache } from 'cache-manager';
export declare class InventoryService {
    private cacheManager;
    constructor(cacheManager: Cache);
    reserveSeats(departureId: string, seats: number, userId: string): Promise<{
        lockId: string;
        expiresAt: number;
    }>;
    confirmSeats(departureId: string, seats: number, lockId: string, bookingId: string): Promise<boolean>;
    releaseSeats(departureId: string, lockId: string): Promise<boolean>;
    getInventoryStatus(departureId: string): Promise<{
        totalSeats: number;
        availableSeats: number;
        lockedSeats: number;
        realTimeAvailable: number;
    }>;
}
