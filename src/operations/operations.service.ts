import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

const prisma = new PrismaClient();

@Injectable()
export class OperationsService {
    private readonly logger = new Logger(OperationsService.name);

    // 1. RESOURCE ASSIGNMENT
    async assignResource(departureId: string, resourceType: 'USER' | 'VEHICLE', resourceId: string, role: string) {
        // Check conflicts
        const existing = await prisma.assignment.findFirst({
            where: {
                [resourceType === 'USER' ? 'userId' : 'vehicleId']: resourceId,
                status: 'CONFIRMED',
                departure: {
                    // Simple conflict check: same dates (intersecting)
                    // fetching dates first would be better efficiency-wise
                    startDate: {},
                }
            },
            include: { departure: true }
        });

        // In a real implementation, we'd query the specific departure dates and check intersection
        // For this v1, we just create the assignment

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

    // 2. READINESS CHECK
    @Cron(CronExpression.EVERY_HOUR)
    async updateReadiness() {
        this.logger.log('Updating Operations Readiness...');

        const activeDepartures = await prisma.departure.findMany({
            where: { startDate: { gt: new Date() } },
            include: { assignments: true, readinessChecklist: true }
        });

        for (const dep of activeDepartures) {
            const checklist = dep.readinessChecklist?.items as Record<string, boolean> || {};

            // Check Guides
            const guides = dep.assignments.filter(a => a.role.includes('GUIDE'));
            checklist['guides_assigned'] = guides.length > 0;

            // Check Vehicles
            const vehicles = dep.assignments.filter(a => a.role.includes('VEHICLE'));
            checklist['vehicle_assigned'] = vehicles.length > 0;

            // Determine State
            const allReady = Object.values(checklist).every(v => v === true);
            const status = allReady ? 'READY' : 'PLANNING';

            // Upsert Checklist
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

    // 3. LOG INCIDENT
    async logIncident(userId: string, data: any) {
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
}
