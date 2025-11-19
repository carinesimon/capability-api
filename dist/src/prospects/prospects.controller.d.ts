import { ProspectsService } from './prospects.service';
import { LeadStage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProspectEventDto } from './dto/create-prospect-event.dto';
export declare class ProspectsController {
    private readonly svc;
    private readonly prisma;
    constructor(svc: ProspectsService, prisma: PrismaService);
    stageOptions(): Promise<{
        value: LeadStage;
        label: string;
    }[]>;
    getBoard(from?: string, to?: string, limit?: string): Promise<{
        columns: Record<import("@prisma/client").$Enums.LeadStage, {
            count: number;
            sumOpportunity: number;
            sumSales: number;
            items: ({
                setter: {
                    id: string;
                    email: string;
                    firstName: string;
                } | null;
                closer: {
                    id: string;
                    email: string;
                    firstName: string;
                } | null;
            } & {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string | null;
                createdAt: Date;
                updatedAt: Date;
                stage: import("@prisma/client").$Enums.LeadStage;
                ghlContactId: string | null;
                phone: string | null;
                tag: string | null;
                source: string | null;
                stageUpdatedAt: Date;
                stageId: string | null;
                boardColumnKey: string | null;
                opportunityValue: number | null;
                saleValue: number | null;
                setterId: string | null;
                closerId: string | null;
            })[];
        }>;
        extraByColumnKey: Record<string, ({
            setter: {
                id: string;
                email: string;
                firstName: string;
            } | null;
            closer: {
                id: string;
                email: string;
                firstName: string;
            } | null;
        } & {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string | null;
            createdAt: Date;
            updatedAt: Date;
            stage: import("@prisma/client").$Enums.LeadStage;
            ghlContactId: string | null;
            phone: string | null;
            tag: string | null;
            source: string | null;
            stageUpdatedAt: Date;
            stageId: string | null;
            boardColumnKey: string | null;
            opportunityValue: number | null;
            saleValue: number | null;
            setterId: string | null;
            closerId: string | null;
        })[]>;
    }>;
    getColumnsConfig(): Promise<{
        ok: boolean;
        columns: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stage: import("@prisma/client").$Enums.LeadStage | null;
            label: string;
            order: number;
            enabled: boolean;
        }[];
    }>;
    putColumnsConfig(payload: Array<{
        id: string;
        label: string;
        order: number;
        enabled: boolean;
        stage?: LeadStage | null;
    }>): Promise<{
        ok: boolean;
        columns: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stage: import("@prisma/client").$Enums.LeadStage | null;
            label: string;
            order: number;
            enabled: boolean;
        }[];
    }>;
    actors(): Promise<{
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
    addEvent(id: string, dto: CreateProspectEventDto): Promise<{
        ok: boolean;
    }>;
    createLead(body: {
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
    }): Promise<{
        ok: boolean;
        lead: {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string | null;
            createdAt: Date;
            updatedAt: Date;
            stage: import("@prisma/client").$Enums.LeadStage;
            ghlContactId: string | null;
            phone: string | null;
            tag: string | null;
            source: string | null;
            stageUpdatedAt: Date;
            stageId: string | null;
            boardColumnKey: string | null;
            opportunityValue: number | null;
            saleValue: number | null;
            setterId: string | null;
            closerId: string | null;
        };
    }>;
    moveStage(id: string, body: {
        stage: LeadStage;
        saleValue?: number;
        confirmSame?: boolean;
    }): Promise<{
        ok: boolean;
        lead: {
            setter: {
                id: string;
                email: string;
                firstName: string;
            } | null;
            closer: {
                id: string;
                email: string;
                firstName: string;
            } | null;
        } & {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string | null;
            createdAt: Date;
            updatedAt: Date;
            stage: import("@prisma/client").$Enums.LeadStage;
            ghlContactId: string | null;
            phone: string | null;
            tag: string | null;
            source: string | null;
            stageUpdatedAt: Date;
            stageId: string | null;
            boardColumnKey: string | null;
            opportunityValue: number | null;
            saleValue: number | null;
            setterId: string | null;
            closerId: string | null;
        };
    }>;
    setBoardColumn(id: string, body: {
        columnKey?: string | null;
    }): Promise<{
        ok: boolean;
    }>;
    updateOne(id: string, body: {
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
    }): Promise<{
        ok: boolean;
        lead: {
            setter: {
                id: string;
                email: string;
                firstName: string;
            } | null;
            closer: {
                id: string;
                email: string;
                firstName: string;
            } | null;
        } & {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string | null;
            createdAt: Date;
            updatedAt: Date;
            stage: import("@prisma/client").$Enums.LeadStage;
            ghlContactId: string | null;
            phone: string | null;
            tag: string | null;
            source: string | null;
            stageUpdatedAt: Date;
            stageId: string | null;
            boardColumnKey: string | null;
            opportunityValue: number | null;
            saleValue: number | null;
            setterId: string | null;
            closerId: string | null;
        };
    }>;
    getOne(id: string): Promise<{
        setter: {
            id: string;
            email: string;
            firstName: string;
        } | null;
        closer: {
            id: string;
            email: string;
            firstName: string;
        } | null;
    } & {
        id: string;
        email: string | null;
        firstName: string;
        lastName: string | null;
        createdAt: Date;
        updatedAt: Date;
        stage: import("@prisma/client").$Enums.LeadStage;
        ghlContactId: string | null;
        phone: string | null;
        tag: string | null;
        source: string | null;
        stageUpdatedAt: Date;
        stageId: string | null;
        boardColumnKey: string | null;
        opportunityValue: number | null;
        saleValue: number | null;
        setterId: string | null;
        closerId: string | null;
    }>;
}
