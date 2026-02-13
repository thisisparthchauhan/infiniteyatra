export declare class OperationsService {
    private readonly logger;
    assignResource(departureId: string, resourceType: 'USER' | 'VEHICLE', resourceId: string, role: string): Promise<{
        id: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        vehicleId: string | null;
        departureId: string;
        status: string;
    }>;
    updateReadiness(): Promise<void>;
    logIncident(userId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        departureId: string | null;
        status: string;
        severity: string;
        resolvedAt: Date | null;
        loggedById: string;
    }>;
}
