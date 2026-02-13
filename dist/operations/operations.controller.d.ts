import { OperationsService } from './operations.service';
export declare class OperationsController {
    private readonly opsService;
    constructor(opsService: OperationsService);
    assignResource(body: any): Promise<{
        id: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        vehicleId: string | null;
        departureId: string;
        status: string;
    }>;
    logIncident(body: any, userId: string): Promise<{
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
    refresh(): Promise<void>;
}
