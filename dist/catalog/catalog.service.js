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
var CatalogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pricing_service_1 = require("../pricing/pricing.service");
const cost_service_1 = require("../cost/cost.service");
const operations_service_1 = require("../operations/operations.service");
const forecast_service_1 = require("../forecast/forecast.service");
const prisma = new client_1.PrismaClient();
let CatalogService = CatalogService_1 = class CatalogService {
    constructor(pricingService, costService, opsService, forecastService) {
        this.pricingService = pricingService;
        this.costService = costService;
        this.opsService = opsService;
        this.forecastService = forecastService;
        this.logger = new common_1.Logger(CatalogService_1.name);
    }
    async getPackages() {
        return prisma.package.findMany({
            include: { departures: true },
        });
    }
    async updatePackage(id, data) {
        this.logger.log(`Orchestrated Update for Package ${id}`);
        const currentParam = await prisma.package.findUnique({ where: { id } });
        const newVersion = ((currentParam === null || currentParam === void 0 ? void 0 : currentParam.version) || 0) + 1;
        const updatedPackage = await prisma.package.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { version: newVersion, healthScore: this.calculatePackageHealth(data) })
        });
        this.triggerDownstreamUpdates(id);
        return updatedPackage;
    }
    calculatePackageHealth(data) {
        return 95;
    }
    async triggerDownstreamUpdates(packageId) {
        const departures = await prisma.departure.findMany({
            where: { packageId, startDate: { gt: new Date() } }
        });
        for (const dep of departures) {
        }
    }
    async getPackage(slug) {
        return prisma.package.findUnique({
            where: { slug },
            include: { departures: true },
        });
    }
    async createPackage(data) {
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
    async addDeparture(data) {
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
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = CatalogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pricing_service_1.PricingService,
        cost_service_1.CostService,
        operations_service_1.OperationsService,
        forecast_service_1.ForecastService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map