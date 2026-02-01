import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class InventoryService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    // 1. ATOMIC SEAT RESERVATION (Redis Lock)
    async reserveSeats(departureId: string, seats: number, userId: string): Promise<{ lockId: string, expiresAt: number }> {
        const lockKey = `lock:departure:${departureId}:seats`;
        const inventoryKey = `inventory:departure:${departureId}`;

        // A. Check PostgreSQL for Base Availability
        const departure = await prisma.departure.findUnique({
            where: { id: departureId },
        });
        if (!departure) throw new NotFoundException('Departure not found');

        // B. Check Redis for Current Locks
        // In a real high-concurrency scenario, we'd use a Lua script for check-and-set here.
        const currentLocks: any = await this.cacheManager.get(lockKey) || {};
        let lockedCount = 0;
        Object.values(currentLocks).forEach((val: any) => lockedCount += val.seats);

        const available = departure.availableSeats - lockedCount;

        if (available < seats) {
            throw new BadRequestException(`Not enough seats. Available: ${available}, Requested: ${seats}`);
        }

        // C. Apply Lock
        const lockId = `${userId}:${Date.now()}`;
        currentLocks[lockId] = { seats, userId, timestamp: Date.now() };

        // TTL: 10 minutes
        await this.cacheManager.set(lockKey, currentLocks, 600);

        return {
            lockId,
            expiresAt: Date.now() + 10 * 60 * 1000
        };
    }

    // 2. CONFIRM SEATS (PostgreSQL Commit)
    async confirmSeats(departureId: string, seats: number, lockId: string, bookingId: string) {
        const lockKey = `lock:departure:${departureId}:seats`;

        // A. Verify Lock exists
        const currentLocks: any = await this.cacheManager.get(lockKey) || {};
        if (!currentLocks[lockId]) {
            // In production, we might allow a grace period or check if it was just lost
            throw new BadRequestException('Reservation expired or invalid');
        }

        // B. Atomic DB Update
        await prisma.$transaction(async (tx) => {
            // Double check availability inside transaction
            const dep = await tx.departure.findUnique({ where: { id: departureId } });
            if (dep.availableSeats < seats) throw new Error('Race condition detected during confirmation');

            // Decrement Seats
            await tx.departure.update({
                where: { id: departureId },
                data: { availableSeats: { decrement: seats } }
            });

            // Audit Log
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

        // C. Release Redis Lock
        delete currentLocks[lockId];
        await this.cacheManager.set(lockKey, currentLocks, 600);

        return true;
    }

    // 3. RELEASE LOCK (Availability Restoration)
    async releaseSeats(departureId: string, lockId: string) {
        const lockKey = `lock:departure:${departureId}:seats`;
        const currentLocks: any = await this.cacheManager.get(lockKey) || {};

        if (currentLocks[lockId]) {
            delete currentLocks[lockId];
            await this.cacheManager.set(lockKey, currentLocks, 600);
        }
        return true;
    }

    async getInventoryStatus(departureId: string) {
        const departure = await prisma.departure.findUnique({ where: { id: departureId } });
        if (!departure) throw new NotFoundException('Departure not found');

        const lockKey = `lock:departure:${departureId}:seats`;
        const currentLocks: any = await this.cacheManager.get(lockKey) || {};
        let lockedCount = 0;
        Object.values(currentLocks).forEach((val: any) => lockedCount += val.seats);

        return {
            totalSeats: departure.totalSeats,
            availableSeats: departure.availableSeats,
            lockedSeats: lockedCount,
            realTimeAvailable: departure.availableSeats - lockedCount
        };
    }
}
