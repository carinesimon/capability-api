import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private metrics;
    constructor(metrics: MetricsService);
    getFunnel(start: string, end: string): Promise<{
        totals: {
            [k: string]: number;
        };
    }>;
}
