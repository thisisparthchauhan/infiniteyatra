"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let InventoryService = class InventoryService {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
    }
    async reserveSeats(departureId, seats, userId) {
        const lockKey = `lock:departure:${departureId}:seats`;
        const inventoryKey = `inventory:departure:${departureId}`;
        const departure = await prisma.departure.findUnique({
            where: { id: departureId },
        });
        if (!departure)
            throw new common_1.NotFoundException('Departure not found');
        const currentLocks = await this.cacheManager.get(lockKey) || {};
        let lockedCount = 0;
        Object.values(currentLocks).forEach((val) => lockedCount += val.seats);
        const available = departure.availableSeats - lockedCount;
        if (available < seats) {
            throw new common_1.BadRequestException(`Not enough seats. Available: ${available}, Requested: ${seats}`);
        }
        const lockId = `${userId}:${Date.now()}`;
        currentLocks[lockId] = { seats, userId, timestamp: Date.now() };
        await this.cacheManager.set(lockKey, currentLocks, 600);
        return {
            lockId,
            expiresAt: Date.now() + 10 * 60 * 1000
        };
    }
    async confirmSeats(departureId, seats, lockId, bookingId) {
        const lockKey = `lock:departure:${departureId}:seats`;
        const currentLocks = await this.cacheManager.get(lockKey) || {};
        if (!currentLocks[lockId]) {
            throw new common_1.BadRequestException('Reservation expired or invalid');
        }
        await prisma.$transaction(async (tx) => {
            const dep = await tx.departure.findUnique({ where: { id: departureId } });
            if (dep.availableSeats < seats)
                throw new Error('Race condition detected during confirmation');
            await tx.departure.update({
                where: { id: departureId },
                data: { availableSeats: { decrement: seats } }
            });
            await tx.inventoryLog.create({
                data: {
                    departureId,
                    action: 'BOOK',
                    seats: -seats,
                    reason: 'Booking confirmed',
                    referenceId: bookingId
                }
            });
        });
        delete currentLocks[lockId];
        await this.cacheManager.set(lockKey, currentLocks, 600);
        return true;
    }
    async releaseSeats(departureId, lockId) {
        const lockKey = `lock:departure:${departureId}:seats`;
        const currentLocks = await this.cacheManager.get(lockKey) || {};
        if (currentLocks[lockId]) {
            delete currentLocks[lockId];
            await this.cacheManager.set(lockKey, currentLocks, 600);
        }
        return true;
    }
    async getInventoryStatus(departureId) {
        const departure = await prisma.departure.findUnique({ where: { id: departureId } });
        if (!departure)
            throw new common_1.NotFoundException('Departure not found');
        const lockKey = `lock:departure:${departureId}:seats`;
        const currentLocks = await this.cacheManager.get(lockKey) || {};
        let lockedCount = 0;
        Object.values(currentLocks).forEach((val) => lockedCount += val.seats);
        return {
            totalSeats: departure.totalSeats,
            availableSeats: departure.availableSeats,
            lockedSeats: lockedCount,
            realTimeAvailable: departure.availableSeats - lockedCount
        };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map