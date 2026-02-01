export declare class OperationsService {
    private readonly logger;
    assignResource(departureId: string, resourceType: 'USER' | 'VEHICLE', resourceId: string, role: string): Promise<{
        id: string;
        departureId: string;
        userId: string | null;
        vehicleId: string | null;
        role: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateReadiness(): Promise<void>;
    logIncident(userId: string, data: any): Promise<{
        id: string;
        departureId: string | null;
        severity: string;
        title: string;
        description: string;
        status: string;
        loggedById: string;
        createdAt: Date;
        resolvedAt: Date | null;
    }>;
}
