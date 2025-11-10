import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metrics;
    constructor(metrics: MetricsService);
    getFunnel(from?: string, to?: string): Promise<import("./metrics.service").FunnelTotals>;
    getLeadsByDay(from?: string, to?: string): Promise<{
        total: number;
        byDay: {
            day: string;
            count: number;
        }[];
    }>;
    getStageSeries(stageStr?: string, from?: string, to?: string): Promise<{
        total: number;
        byDay: {
            day: string;
            count: number;
        }[];
    }>;
}
