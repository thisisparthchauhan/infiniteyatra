import { OperationsService } from './operations.service';
export declare class OperationsController {
    private readonly opsService;
    constructor(opsService: OperationsService);
    assignResource(body: any): Promise<{
        id: string;
        departureId: string;
        userId: string | null;
        vehicleId: string | null;
        role: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    logIncident(body: any, userId: string): Promise<{
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
    refresh(): Promise<void>;
}
