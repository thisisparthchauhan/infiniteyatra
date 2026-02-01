import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PricingService } from '../pricing/pricing.service';
import { CostService } from '../cost/cost.service';
import { OperationsService } from '../operations/operations.service';
import { ForecastService } from '../forecast/forecast.service';

const prisma = new PrismaClient();

@Injectable()
export class CatalogService {
    private readonly logger = new Logger(CatalogService.name);

    constructor(
        private pricingService: PricingService,
        private costService: CostService,
        private opsService: OperationsService,
        private forecastService: ForecastService
    ) { }

    async getPackages() {
        return prisma.package.findMany({
            include: { departures: true },
        });
    }

    // ORCHESTRATED UPDATE
    async updatePackage(id: string, data: any) {
        this.logger.log(`Orchestrated Update for Package ${id}`);

        // 1. Versioning: In real app, we might create a copy. For now, we increment version.
        const currentParam = await prisma.package.findUnique({ where: { id } });
        const newVersion = ((currentParam as any)?.version || 0) + 1;

        // 2. Update Core Data
        const updatedPackage = await prisma.package.update({
            where: { id },
            data: {
                ...data,
                version: newVersion,
                healthScore: this.calculatePackageHealth(data) // Simple Logic
            }
        });

        // 3. Trigger Downstream Updates (Async ideally)
        this.triggerDownstreamUpdates(id);

        return updatedPackage;
    }

    private calculatePackageHealth(data: any) {
        // Mock Logic: If complete data, score is high
        return 95;
    }

    private async triggerDownstreamUpdates(packageId: string) {
        // Logic to notify other engines
        // e.g. re-evaluate costs for all future departures
        const departures = await prisma.departure.findMany({
            where: { packageId, startDate: { gt: new Date() } }
        });

        for (const dep of departures) {
            // Re-check Ops Readiness
            // Re-run Forecast
        }
    }

    async getPackage(slug: string) {
        return prisma.package.findUnique({
            where: { slug },
            include: { departures: true },
        });
    }

    async createPackage(data: any) {
        return prisma.package.create({
            data: {
                slug: data.slug,
                title: data.title,
                description: data.description,
                basePrice: data.basePrice,
                costPerSeat: data.costPerSeat,
                durationDays: data.durationDays,
                type: data.type,
            },
        });
    }

    async addDeparture(data: any) {
        return prisma.departure.create({
            data: {
                packageId: data.packageId,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                totalSeats: data.totalSeats,
                availableSeats: data.totalSeats,
                vehicleId: data.vehicleId,
                guideId: data.guideId,
                costOverride: data.costOverride,
                priceOverride: data.priceOverride,
            },
        });
    }
}
