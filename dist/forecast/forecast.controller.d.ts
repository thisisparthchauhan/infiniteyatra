import { ForecastService } from './forecast.service';
export declare class ForecastController {
    private readonly forecastService;
    constructor(forecastService: ForecastService);
    predict(id: string): Promise<{
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
    capture(): Promise<void>;
}
