import { PrismaService } from '../prisma/prisma.service';
import { LeadStage } from '@prisma/client';
import { ReportingService } from '../reporting/reporting.service';
import { StageEventsService } from '../modules/leads/stage-events.service';
import { CreateProspectEventDto } from './dto/create-prospect-event.dto';
export type PipelineMetricKey = 'LEADS_RECEIVED' | 'CALL_REQUESTED' | 'CALL_ATTEMPT' | 'CALL_ANSWERED' | 'SETTER_NO_SHOW' | 'FOLLOW_UP' | 'RV0_PLANNED' | 'RV0_HONORED' | 'RV0_NO_SHOW' | 'RV1_PLANNED' | 'RV1_HONORED' | 'RV1_NO_SHOW' | 'RV1_POSTPONED' | 'RV2_PLANNED' | 'RV2_HONORED' | 'RV2_POSTPONED' | 'NOT_QUALIFIED' | 'LOST' | 'WON';
type OpsColumn = {
    key: PipelineMetricKey;
    label: string;
    count: number;
};
type BoardArgs = {
    from?: string;
    to?: string;
    limit?: number;
};
type MoveStageBody = {
    stage: LeadStage;
    saleValue?: number;
    confirmSame?: boolean;
};
type EditLeadBody = {
    firstName?: string;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    tag?: string | null;
    source?: string | null;
    opportunityValue?: number | null;
    saleValue?: number | null;
    setterId?: string | null;
    closerId?: string | null;
};
type CreateLeadBody = {
    firstName: string;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    tag?: string | null;
    source?: string | null;
    opportunityValue?: number | null;
    saleValue?: number | null;
    stage?: LeadStage;
    setterId?: string | null;
    closerId?: string | null;
};
export declare class ProspectsService {
    private prisma;
    private reporting;
    private stageEvents;
    constructor(prisma: PrismaService, reporting: ReportingService, stageEvents: StageEventsService);
    getMetricsCatalog(): {
        ok: boolean;
        catalog: {
            key: PipelineMetricKey;
            label: string;
            sourcePath: string;
            order: number;
            enabled: boolean;
        }[];
    };
    moveToFreeColumn(leadId: string, columnKey: string): Promise<{
        ok: boolean;
    }>;
    getOpsColumns(from?: string, to?: string): Promise<{
        ok: true;
        columns: OpsColumn[];
        period: {
            from?: string;
            to?: string;
        };
    }>;
    private DEFAULT_BOARD_COLUMNS;
    getColumnsConfig(): Promise<{
        ok: boolean;
        columns: {
            id: string;
            stage: import("@prisma/client").$Enums.LeadStage | null;
            createdAt: Date;
            updatedAt: Date;
            label: string;
            order: number;
            enabled: boolean;
        }[];
    }>;
    putColumnsConfig(payload: Array<{
        id?: string;
        label?: string;
        order?: number;
        enabled?: boolean;
        stage?: LeadStage | null;
    }>): Promise<{
        ok: boolean;
        columns: {
            id: string;
            stage: import("@prisma/client").$Enums.LeadStage | null;
            createdAt: Date;
            updatedAt: Date;
            label: string;
            order: number;
            enabled: boolean;
        }[];
    }>;
    updateLeadStage(leadId: string, toStage: LeadStage, source?: string, externalId?: string): Promise<{
        ok: boolean;
    }>;
    moveToBoardColumn(leadId: string, columnKey: string): Promise<{
        ok: boolean;
    }>;
    private buildRangeOr;
    getBoard({ from, to, limit }: BoardArgs): Promise<{
        columns: Record<import("@prisma/client").$Enums.LeadStage, {
            count: number;
            sumOpportunity: number;
            sumSales: number;
            items: ({
                setter: {
                    id: string;
                    firstName: string;
                    email: string;
                } | null;
                closer: {
                    id: string;
                    firstName: string;
                    email: string;
                } | null;
            } & {
                id: string;
                firstName: string;
                lastName: string | null;
                email: string | null;
                phone: string | null;
                tag: string | null;
                source: string | null;
                stage: import("@prisma/client").$Enums.LeadStage;
                stageUpdatedAt: Date;
                stageId: string | null;
                boardColumnKey: string | null;
                opportunityValue: number | null;
                saleValue: number | null;
                setterId: string | null;
                closerId: string | null;
                ghlContactId: string | null;
                createdAt: Date;
                updatedAt: Date;
            })[];
        }>;
    }>;
    private ensureNonNegative;
    moveStage(id: string, body: MoveStageBody): Promise<{
        ok: boolean;
        lead: {
            setter: {
                id: string;
                firstName: string;
                email: string;
            } | null;
            closer: {
                id: string;
                firstName: string;
                email: string;
            } | null;
        } & {
            id: string;
            firstName: string;
            lastName: string | null;
            email: string | null;
            phone: string | null;
            tag: string | null;
            source: string | null;
            stage: import("@prisma/client").$Enums.LeadStage;
            stageUpdatedAt: Date;
            stageId: string | null;
            boardColumnKey: string | null;
            opportunityValue: number | null;
            saleValue: number | null;
            setterId: string | null;
            closerId: string | null;
            ghlContactId: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getOne(id: string): Promise<{
        setter: {
            id: string;
            firstName: string;
            email: string;
        } | null;
        closer: {
            id: string;
            firstName: string;
            email: string;
        } | null;
    } & {
        id: string;
        firstName: string;
        lastName: string | null;
        email: string | null;
        phone: string | null;
        tag: string | null;
        source: string | null;
        stage: import("@prisma/client").$Enums.LeadStage;
        stageUpdatedAt: Date;
        stageId: string | null;
        boardColumnKey: string | null;
        opportunityValue: number | null;
        saleValue: number | null;
        setterId: string | null;
        closerId: string | null;
        ghlContactId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateOne(id: string, body: EditLeadBody): Promise<{
        ok: boolean;
        lead: {
            setter: {
                id: string;
                firstName: string;
                email: string;
            } | null;
            closer: {
                id: string;
                firstName: string;
                email: string;
            } | null;
        } & {
            id: string;
            firstName: string;
            lastName: string | null;
            email: string | null;
            phone: string | null;
            tag: string | null;
            source: string | null;
            stage: import("@prisma/client").$Enums.LeadStage;
            stageUpdatedAt: Date;
            stageId: string | null;
            boardColumnKey: string | null;
            opportunityValue: number | null;
            saleValue: number | null;
            setterId: string | null;
            closerId: string | null;
            ghlContactId: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    createLead(body: CreateLeadBody): Promise<{
        ok: boolean;
        lead: {
            id: string;
            firstName: string;
            lastName: string | null;
            email: string | null;
            phone: string | null;
            tag: string | null;
            source: string | null;
            stage: import("@prisma/client").$Enums.LeadStage;
            stageUpdatedAt: Date;
            stageId: string | null;
            boardColumnKey: string | null;
            opportunityValue: number | null;
            saleValue: number | null;
            setterId: string | null;
            closerId: string | null;
            ghlContactId: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    listActors(): Promise<{
        setters: {
            id: string;
            firstName: string;
            email: string;
        }[];
        closers: {
            id: string;
            firstName: string;
            email: string;
        }[];
    }>;
    buildCsvTemplate(): string;
    importCsv(buffer: Buffer): Promise<{
        created: number;
        updated: number;
        errors: number;
        ok: boolean;
    }>;
    private splitCsvLine;
    private parseNum;
    private safeStage;
    getMetricsConfig(): Promise<{
        ok: boolean;
        metrics: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            label: string;
            order: number;
            key: string;
            sourcePath: string;
            enabled: boolean;
        }[];
    }>;
    putMetricsConfig(payload: Array<{
        key: PipelineMetricKey;
        label?: string;
        sourcePath?: string;
        order?: number;
        enabled?: boolean;
    }>): Promise<{
        ok: boolean;
        metrics: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            label: string;
            order: number;
            key: string;
            sourcePath: string;
            enabled: boolean;
        }[];
    }>;
    resetMetricsConfig(): Promise<{
        ok: boolean;
        metrics: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            label: string;
            order: number;
            key: string;
            sourcePath: string;
            enabled: boolean;
        }[];
    }>;
    addEvent(leadId: string, body: CreateProspectEventDto): Promise<{
        ok: boolean;
        event: any;
    }>;
}
export {};
