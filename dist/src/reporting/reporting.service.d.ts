import { PrismaService } from '../prisma/prisma.service';
type SetterRow = {
    userId: string;
    name: string;
    email: string;
    leadsReceived: number;
    rv0Count: number;
    rv1FromHisLeads: number;
    ttfcAvgMinutes: number | null;
    revenueFromHisLeads: number;
    spendShare: number | null;
    cpl: number | null;
    cpRv0: number | null;
    cpRv1: number | null;
    roas: number | null;
};
type CloserRow = {
    userId: string;
    name: string;
    email: string;
    rv1Planned: number;
    rv1Honored: number;
    rv1NoShow: number;
    rv2Planned: number;
    rv2Honored: number;
    salesClosed: number;
    revenueTotal: number;
    roasPlanned: number | null;
    roasHonored: number | null;
};
type DuoRow = {
    setterId: string;
    setterName: string;
    setterEmail: string;
    closerId: string;
    closerName: string;
    closerEmail: string;
    salesCount: number;
    revenue: number;
    avgDeal: number;
    rv1Planned: number;
    rv1Honored: number;
    rv1HonorRate: number | null;
};
type LeadsReceivedOut = {
    total: number;
    byDay?: Array<{
        day: string;
        count: number;
    }>;
};
type SalesWeeklyItem = {
    weekStart: string;
    weekEnd: string;
    revenue: number;
    count: number;
};
type SummaryOut = {
    period: {
        from?: string;
        to?: string;
    };
    totals: {
        leads: number;
        revenue: number;
        salesCount: number;
        spend: number;
        roas: number | null;
        settersCount: number;
        closersCount: number;
        rv1Honored: number;
    };
};
type WeeklyOpsRow = {
    weekStart: string;
    weekEnd: string;
    rv0Planned: number;
    rv0Honored: number;
    rv0NoShow?: number;
    rv1Planned: number;
    rv1Honored: number;
    rv1NoShow: number;
    rv1Postponed?: number;
    rv2Planned: number;
    rv2Honored: number;
    rv2Postponed?: number;
    notQualified?: number;
    lost?: number;
};
type FunnelTotals = {
    leads: number;
    callRequests: number;
    callsTotal: number;
    callsAnswered: number;
    setterNoShow: number;
    rv0Planned: number;
    rv0Honored: number;
    rv0NoShow: number;
    rv1Planned: number;
    rv1Honored: number;
    rv1NoShow: number;
    rv2Planned: number;
    rv2Honored: number;
    notQualified: number;
    lost: number;
    wonCount: number;
};
type FunnelWeeklyRow = {
    weekStart: string;
    weekEnd: string;
} & FunnelTotals;
type FunnelOut = {
    period: {
        from?: string;
        to?: string;
    };
    totals: FunnelTotals;
    weekly: FunnelWeeklyRow[];
};
export declare class ReportingService {
    private prisma;
    constructor(prisma: PrismaService);
    private wonStageIds;
    private wonFilter;
    private sumSpend;
    leadsReceived(from?: string, to?: string): Promise<LeadsReceivedOut>;
    private variantsFor;
    private historyWhere;
    private countHistory;
    private perDayFromHistory;
    private countHistoryMany;
    salesWeekly(from?: string, to?: string): Promise<SalesWeeklyItem[]>;
    settersReport(from?: string, to?: string): Promise<SetterRow[]>;
    duosReport(from?: string, to?: string, top?: number): Promise<DuoRow[]>;
    pipelineStageTotals(from?: string, to?: string): Promise<{
        ok: boolean;
        stages: any;
    }>;
    closersReport(from?: string, to?: string): Promise<CloserRow[]>;
    summary(from?: string, to?: string): Promise<SummaryOut>;
    pipelineMetrics(args: {
        keys: string[];
        from?: string;
        to?: string;
        mode?: 'entered' | 'current';
    }): Promise<Record<string, number>>;
    private funnelFromHistory;
    funnel(from?: string, to?: string): Promise<FunnelOut>;
    weeklySeries(from?: string, to?: string): Promise<WeeklyOpsRow[]>;
    metricCallRequests(from?: string, to?: string): Promise<{
        total: number;
        byDay?: Array<{
            day: string;
            count: number;
        }>;
    }>;
    metricCalls(from?: string, to?: string): Promise<{
        total: number;
        byDay?: Array<{
            day: string;
            count: number;
        }>;
    }>;
    metricCallsAnswered(from?: string, to?: string): Promise<{
        total: number;
        byDay?: Array<{
            day: string;
            count: number;
        }>;
    }>;
    drillLeadsReceived(args: {
        from?: string;
        to?: string;
        limit: number;
    }): Promise<{
        ok: boolean;
        count: number;
        items: {
            leadId: string;
            leadName: string;
            email: string | null;
            phone: string | null;
            setter: {
                id: string;
                name: string;
                email: string;
            } | null;
            closer: {
                id: string;
                name: string;
                email: string;
            } | null;
            appointment: null;
            saleValue: number | null;
            createdAt: string;
        }[];
    }>;
    drillWon(args: {
        from?: string;
        to?: string;
        limit: number;
    }): Promise<{
        ok: boolean;
        count: number;
        items: {
            leadId: string;
            leadName: string;
            email: string | null;
            phone: string | null;
            setter: {
                id: string;
                name: string;
                email: string;
            } | null;
            closer: {
                id: string;
                name: string;
                email: string;
            } | null;
            appointment: null;
            saleValue: number | null;
            createdAt: string;
            stageUpdatedAt: string;
        }[];
    }>;
    drillAppointments(args: {
        from?: string;
        to?: string;
        type?: 'RV0' | 'RV1' | 'RV2';
        status?: 'HONORED' | 'POSTPONED' | 'CANCELED' | 'NO_SHOW' | 'NOT_QUALIFIED';
        userId?: string;
        limit: number;
    }): Promise<{
        ok: boolean;
        count: number;
        items: {
            leadId: string;
            leadName: string;
            email: string | null;
            phone: string | null;
            setter: {
                id: string;
                name: string;
                email: string;
            } | null;
            closer: {
                id: string;
                name: string;
                email: string;
            } | null;
            appointment: {
                type: import("@prisma/client").$Enums.AppointmentType;
                status: import("@prisma/client").$Enums.AppointmentStatus;
                scheduledAt: string;
            };
            saleValue: number | null;
            createdAt: string;
            stageUpdatedAt: string;
        }[];
    }>;
    drillCallRequests(args: {
        from?: string;
        to?: string;
        limit: number;
    }): Promise<{
        ok: boolean;
        count: number;
        items: {
            leadId: string;
            leadName: string;
            email: string | null;
            phone: string | null;
            setter: {
                id: string;
                name: string;
                email: string;
            } | null;
            closer: {
                id: string;
                name: string;
                email: string;
            } | null;
            appointment: {
                type: string;
                status: any;
                scheduledAt: string;
            };
            saleValue: number | null;
            createdAt: string;
            stageUpdatedAt: string;
        }[];
    }>;
    drillCalls(args: {
        from?: string;
        to?: string;
        answered?: boolean;
        setterNoShow?: boolean;
        limit: number;
    }): Promise<{
        ok: boolean;
        count: number;
        items: {
            leadId: string;
            leadName: string;
            email: string | null;
            phone: string | null;
            setter: {
                id: string;
                name: string;
                email: string;
            } | null;
            closer: {
                id: string;
                name: string;
                email: string;
            } | null;
            appointment: {
                type: string;
                status: any;
                scheduledAt: string;
            };
            saleValue: number | null;
            createdAt: string;
            stageUpdatedAt: string;
        }[];
    } | {
        ok: boolean;
        count: number;
        items: {
            leadId: string;
            leadName: string;
            email: string | null;
            phone: string | null;
            setter: {
                id: string;
                name: string;
                email: string;
            } | null;
            closer: {
                id: string;
                name: string;
                email: string;
            } | null;
            appointment: null;
            saleValue: number | null;
            createdAt: string;
            stageUpdatedAt: string;
        }[];
    }>;
}
export {};
