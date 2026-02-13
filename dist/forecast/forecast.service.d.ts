export declare class ForecastService {
    private readonly logger;
    captureDailySignals(): Promise<void>;
    generateForecast(departureId: string): Promise<{
        prediction: number;
        confidence: number;
        risk: string;
        predictedFinalBooked?: undefined;
        velocity?: undefined;
    } | {
        predictedFinalBooked: number;
        velocity: number;
        risk: string;
        prediction?: undefined;
        confidence?: undefined;
    }>;
}
