import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
export declare class ContractsController {
    private readonly service;
    constructor(service: ContractsService);
    create(body: CreateContractDto): import("@prisma/client").Prisma.Prisma__ContractClient<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string | null;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            passwordHash: string | null;
            lastLoginAt: Date | null;
        };
        lead: {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string | null;
            createdAt: Date;
            updatedAt: Date;
            stage: import("@prisma/client").$Enums.LeadStage;
            source: string | null;
            ghlContactId: string | null;
            phone: string | null;
            tag: string | null;
            stageUpdatedAt: Date;
            stageId: string | null;
            boardColumnKey: string | null;
            opportunityValue: number | null;
            saleValue: number | null;
            setterId: string | null;
            closerId: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        leadId: string | null;
        amount: number;
        userId: string;
        deposit: number | null;
        monthly: number | null;
        total: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(from?: string, to?: string, userId?: string): import("@prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string | null;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            passwordHash: string | null;
            lastLoginAt: Date | null;
        };
        lead: {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string | null;
            createdAt: Date;
            updatedAt: Date;
            stage: import("@prisma/client").$Enums.LeadStage;
            source: string | null;
            ghlContactId: string | null;
            phone: string | null;
            tag: string | null;
            stageUpdatedAt: Date;
            stageId: string | null;
            boardColumnKey: string | null;
            opportunityValue: number | null;
            saleValue: number | null;
            setterId: string | null;
            closerId: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        leadId: string | null;
        amount: number;
        userId: string;
        deposit: number | null;
        monthly: number | null;
        total: number;
    })[]>;
}
