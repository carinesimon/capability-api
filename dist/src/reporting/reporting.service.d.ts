import { PrismaService } from '../prisma/prisma.service';
import { BudgetPeriod } from '@prisma/client';
type RangeArgs = {
    from?: string;
    to?: string;
};
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
    rv1PlannedFromHisLeads: number;
    rv1CanceledFromHisLeads: number;
    rv1NoShowFromHisLeads: number;
    salesFromHisLeads: number;
};
type CloserRow = {
    userId: string;
    name: string;
    email: string;
    rv1Planned: number;
    rv1Honored: number;
    rv1NoShow: number;
    rv1Canceled: number;
    rv1Postponed: number;
    rv1NotQualified: number;
    rv2Planned: number;
    rv2Honored: number;
    rv2NoShow: number;
    rv2Canceled: number;
    rv2Postponed: number;
    contractsSigned: number;
    salesClosed: number;
    revenueTotal: number;
    roasPlanned: number | null;
    roasHonored: number | null;
    rv1CancelRate: number | null;
    rv1NoShowRate?: number | null;
    rv2CancelRate: number | null;
    rv2NoShowRate?: number | null;
};
type SpotlightSetterRow = {
    userId: string;
    name: string;
    email: string;
    rv1PlannedOnHisLeads: number;
    rv1DoneOnHisLeads: number;
    rv1CanceledOnHisLeads: number;
    rv1NoShowOnHisLeads: number;
    rv1CancelRate: number | null;
    rv1NoShowRate: number | null;
    salesFromHisLeads: number;
    revenueFromHisLeads: number;
    settingRate: number | null;
    leadsReceived: number;
    ttfcAvgMinutes: number | null;
};
type SpotlightCloserRow = {
    userId: string;
    name: string;
    email: string;
    rv1Planned: number;
    rv1Honored: number;
    rv1Canceled: number;
    rv1NoShow: number;
    rv1CancelRate: number | null;
    rv2Planned: number;
    rv2Canceled: number;
    rv2NoShow: number;
    rv2CancelRate: number | null;
    salesClosed: number;
    revenueTotal: number;
    closingRate: number | null;
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
    rv2NoShow: number;
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
    rv0Canceled: number;
    rv1Planned: number;
    rv1Honored: number;
    rv1NoShow: number;
    rv1Canceled: number;
    rv1Postponed: number;
    rv2Planned: number;
    rv2Honored: number;
    rv2NoShow: number;
    rv2Canceled: number;
    rv2Postponed: number;
    rv0NotQualified: number;
    rv1NotQualified: number;
    followUpSetter: number;
    followUpCloser: number;
    notQualified: number;
    lost: number;
    wonCount: number;
    appointmentCanceled: number;
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
export declare class ReportingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private dateSqlBounds;
    private countSE;
    private countSEGroupedBySetterDistinct;
    private wonStageIds;
    private wonFilter;
    exportSpotlightSettersCSV({ from, to }: RangeArgs): Promise<Buffer>;
    exportSpotlightClosersCSV({ from, to }: RangeArgs): Promise<Buffer>;
    private buildSpotlightPDF;
    private buildSetterAnalysis;
    private buildCloserAnalysis;
    exportSpotlightSettersPDF({ from, to }: {
        from?: string;
        to?: string;
    }): Promise<Buffer>;
    exportSpotlightClosersPDF({ from, to }: {
        from?: string;
        to?: string;
    }): Promise<Buffer>;
    private sumSpend;
    upsertWeeklyBudget(weekStartISO: string, amount: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        period: import("@prisma/client").$Enums.BudgetPeriod;
        amount: number;
        weekStart: Date | null;
        monthStart: Date | null;
        caEncaisse: number;
    }>;
    listWeeklyBudgets(): Promise<Array<{
        id: string;
        period: BudgetPeriod;
        amount: number;
        weekStart: string | null;
        monthStart: string | null;
        createdAt: string;
        updatedAt: string;
    }>>;
    weeklyBudgets(from?: string, to?: string): Promise<Array<{
        weekStart: string;
        weekEnd: string;
        amount: number;
    }>>;
    leadsReceived(from?: string, to?: string): Promise<LeadsReceivedOut>;
    salesWeekly(from?: string, to?: string): Promise<SalesWeeklyItem[]>;
    private ttfcBySetter;
    private ttfcBySetterViaStages;
    settersReport(from?: string, to?: string): Promise<SetterRow[]>;
    private perDayFromStageEvents;
    stageSeries(stage: string, from?: string, to?: string, tz?: string): Promise<{
        total: number;
        byDay?: Array<{
            day: string;
            count: number;
        }>;
    }>;
    canceledDaily(from?: string, to?: string, tz?: string): Promise<{
        total: number;
        byDay: Array<{
            day: string;
            rv1CanceledPostponed: number;
            rv2CanceledPostponed: number;
            total: number;
        }>;
    }>;
    closersReport(from?: string, to?: string): Promise<CloserRow[]>;
    spotlightSetters(from?: string, to?: string): Promise<SpotlightSetterRow[]>;
    spotlightClosers(from?: string, to?: string): Promise<SpotlightCloserRow[]>;
    duosReport(from?: string, to?: string): Promise<DuoRow[]>;
    summary(from?: string, to?: string): Promise<SummaryOut>;
    private stageIdsForKeys;
    private countEnteredInStages;
    private countCurrentInStages;
    pipelineMetrics(args: {
        keys: string[];
        from?: string;
        to?: string;
        mode?: 'entered' | 'current';
    }): Promise<Record<string, number>>;
    private funnelFromStages;
    funnel(from?: string, to?: string): Promise<FunnelOut>;
    weeklySeries(from?: string, to?: string): Promise<WeeklyOpsRow[]>;
    private perDayFromStages;
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
    metricCallsCanceled0(f?: string, t?: string, tz?: string): Promise<{
        total: number;
        byDay?: Array<{
            day: string;
            count: number;
        }>;
    }>;
    metricCallsCanceled1(f?: string, t?: string, tz?: string): Promise<{
        total: number;
        byDay?: Array<{
            day: string;
            count: number;
        }>;
    }>;
    metricCallsCanceled2(f?: string, t?: string, tz?: string): Promise<{
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
        status?: 'PLANNED' | 'HONORED' | 'POSTPONED' | 'CANCELED' | 'NO_SHOW' | 'NOT_QUALIFIED';
        userId?: string;
        limit: number;
    }): Promise<{
        ok: true;
        count: number;
        items: any[];
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
