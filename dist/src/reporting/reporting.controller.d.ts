import { ReportingService } from './reporting.service';
export declare class ReportingController {
    private readonly reporting;
    constructor(reporting: ReportingService);
    getSummary(from?: string, to?: string, _tz?: string): Promise<{
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
    }>;
    getBudgets(): Promise<{
        id: string;
        period: import("@prisma/client").BudgetPeriod;
        amount: number;
        weekStart: string | null;
        monthStart: string | null;
        createdAt: string;
        updatedAt: string;
    }[]>;
    upsertBudget(body: {
        weekStartISO: string;
        amount: number;
    }): Promise<{
        ok: boolean;
        budget: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            period: import("@prisma/client").$Enums.BudgetPeriod;
            amount: number;
            weekStart: Date | null;
            monthStart: Date | null;
            caEncaisse: number;
        };
    }>;
    getLeadsReceived(from?: string, to?: string, _tz?: string): Promise<{
        total: number;
        byDay?: Array<{
            day: string;
            count: number;
        }>;
    }>;
    spotlightSetters(from?: string, to?: string, _tz?: string): Promise<{
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
    }[]>;
    spotlightClosers(from?: string, to?: string, _tz?: string): Promise<{
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
    }[]>;
    exportSpotlightSettersCsv(from?: string, to?: string, _tz?: string, res?: any): Promise<any>;
    exportSpotlightClosersCsv(from?: string, to?: string, _tz?: string, res?: any): Promise<any>;
    exportSpotlightSettersPdf(from?: string, to?: string, _tz?: string, res?: any): Promise<any>;
    exportSpotlightClosersPdf(from?: string, to?: string, _tz?: string, res?: any): Promise<any>;
    getSalesWeekly(from?: string, to?: string, _tz?: string): Promise<{
        weekStart: string;
        weekEnd: string;
        revenue: number;
        count: number;
    }[]>;
    getSetters(from?: string, to?: string, _tz?: string): Promise<{
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
    }[]>;
    getClosers(from?: string, to?: string, _tz?: string): Promise<{
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
    }[]>;
    getDuos(from?: string, to?: string, _tz?: string): Promise<{
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
    }[]>;
    getWeeklyOps(from?: string, to?: string, _tz?: string): Promise<{
        ok: true;
        rows: {
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
        }[];
    }>;
    getFunnel(from?: string, to?: string, _tz?: string): Promise<{
        period: {
            from?: string;
            to?: string;
        };
        totals: {
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
        weekly: ({
            weekStart: string;
            weekEnd: string;
        } & {
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
        })[];
    }>;
    getPipelineMetrics(keys?: string, from?: string, to?: string, mode?: 'entered' | 'current', _tz?: string): Promise<Record<string, number>>;
    drillLeads(from?: string, to?: string, limitStr?: string, _tz?: string): Promise<{
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
    drillWon(from?: string, to?: string, limitStr?: string, _tz?: string): Promise<{
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
    drillAppointments(from?: string, to?: string, type?: 'RV0' | 'RV1' | 'RV2', status?: 'HONORED' | 'POSTPONED' | 'CANCELED' | 'NO_SHOW' | 'NOT_QUALIFIED', userId?: string, limitStr?: string, _tz?: string): Promise<{
        ok: true;
        count: number;
        items: any[];
    }>;
    drillCallRequests(from?: string, to?: string, limitStr?: string, _tz?: string): Promise<{
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
    drillCalls(from?: string, to?: string, answeredStr?: string, setterNoShowStr?: string, limitStr?: string, _tz?: string): Promise<{
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
    metricStageSeries(stage?: string, from?: string, to?: string, _tz?: string): Promise<{
        total: number;
        byDay?: Array<{
            day: string;
            count: number;
        }>;
    }>;
    leadsByDay(from?: string, to?: string, _tz?: string): Promise<{
        total: number;
        byDay?: Array<{
            day: string;
            count: number;
        }>;
    }>;
    canceledDaily(from?: string, to?: string, _tz?: string): Promise<{
        total: number;
        byDay: Array<{
            day: string;
            rv1CanceledPostponed: number;
            rv2CanceledPostponed: number;
            total: number;
        }>;
    }>;
}
