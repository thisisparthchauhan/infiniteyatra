export declare class HealthController {
    check(): {
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
        service: string;
    };
}
