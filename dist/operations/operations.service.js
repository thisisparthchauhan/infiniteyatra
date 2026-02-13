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
var OperationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const schedule_1 = require("@nestjs/schedule");
const prisma = new client_1.PrismaClient();
let OperationsService = OperationsService_1 = class OperationsService {
    constructor() {
        this.logger = new common_1.Logger(OperationsService_1.name);
    }
    async assignResource(departureId, resourceType, resourceId, role) {
        const existing = await prisma.assignment.findFirst({
            where: {
                [resourceType === 'USER' ? 'userId' : 'vehicleId']: resourceId,
                status: 'CONFIRMED',
                departure: {
                    startDate: {},
                }
            },
            include: { departure: true }
        });
        return prisma.assignment.create({
            data: {
                departureId,
                role,
                status: 'CONFIRMED',
                userId: resourceType === 'USER' ? resourceId : undefined,
                vehicleId: resourceType === 'VEHICLE' ? resourceId : undefined,
            }
        });
    }
    async updateReadiness() {
        var _a;
        this.logger.log('Updating Operations Readiness...');
        const activeDepartures = await prisma.departure.findMany({
            where: { startDate: { gt: new Date() } },
            include: { assignments: true, readinessChecklist: true }
        });
        for (const dep of activeDepartures) {
            const checklist = ((_a = dep.readinessChecklist) === null || _a === void 0 ? void 0 : _a.items) || {};
            const guides = dep.assignments.filter(a => a.role.includes('GUIDE'));
            checklist['guides_assigned'] = guides.length > 0;
            const vehicles = dep.assignments.filter(a => a.role.includes('VEHICLE'));
            checklist['vehicle_assigned'] = vehicles.length > 0;
            const allReady = Object.values(checklist).every(v => v === true);
            const status = allReady ? 'READY' : 'PLANNING';
            await prisma.readinessChecklist.upsert({
                where: { departureId: dep.id },
                update: { items: checklist, status },
                create: {
                    departureId: dep.id,
                    items: checklist,
                    status
                }
            });
        }
    }
    async logIncident(userId, data) {
        return prisma.incident.create({
            data: {
                title: data.title,
                description: data.description,
                severity: data.severity,
                status: 'OPEN',
                departureId: data.departureId,
                loggedById: userId
            }
        });
    }
};
exports.OperationsService = OperationsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OperationsService.prototype, "updateReadiness", null);
exports.OperationsService = OperationsService = OperationsService_1 = __decorate([
    (0, common_1.Injectable)()
], OperationsService);
//# sourceMappingURL=operations.service.js.map