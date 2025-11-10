import { ReportingService } from './reporting.service';
export declare class ReportingController {
    private readonly reporting;
    constructor(reporting: ReportingService);
    getSummary(from?: string, to?: string): Promise<{
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
    getLeadsReceived(from?: string, to?: string): Promise<{
        total: number;
        byDay?: Array<{
            day: string;
            count: number;
        }>;
    }>;
    getSalesWeekly(from?: string, to?: string): Promise<{
        weekStart: string;
        weekEnd: string;
        revenue: number;
        count: number;
    }[]>;
    getSetters(from?: string, to?: string): Promise<{
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
    }[]>;
    getClosers(from?: string, to?: string): Promise<{
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
    }[]>;
    getDuos(from?: string, to?: string): Promise<{
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
    getWeeklyOps(from?: string, to?: string): Promise<{
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
            rv2Postponed?: number;
            notQualified?: number;
            lost?: number;
        }[];
    }>;
    drillLeads(from?: string, to?: string, limitStr?: string): Promise<{
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
    drillWon(from?: string, to?: string, limitStr?: string): Promise<{
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
    drillAppointments(from?: string, to?: string, type?: 'RV0' | 'RV1' | 'RV2', status?: 'HONORED' | 'POSTPONED' | 'CANCELED' | 'NO_SHOW' | 'NOT_QUALIFIED', userId?: string, limitStr?: string): Promise<{
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
    drillCallRequests(from?: string, to?: string, limitStr?: string): Promise<{
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
    drillCalls(from?: string, to?: string, answeredStr?: string, setterNoShowStr?: string, limitStr?: string): Promise<{
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
