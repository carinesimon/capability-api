import { PrismaService } from '../prisma/prisma.service';
type AssignRule = {
    role: 'SETTER' | 'CLOSER';
    by: 'email' | 'name' | 'static';
    from?: string;
    match?: {
        equals?: string;
        contains?: string;
        regex?: string;
    };
    userId?: string;
};
type ApplyArgs = {
    leadId: string;
    automation: {
        id: string;
        status: 'OFF' | 'DRY_RUN' | 'ON';
        mappingJson?: any;
        metaJson?: any;
    };
    payload: any;
    dryRun?: boolean;
};
type ApplyResult = {
    matchedRuleIndex?: number;
    matchedRule?: AssignRule;
    assignedSetterId?: string | null;
    assignedCloserId?: string | null;
    usedRoundRobin?: boolean;
    roundRobinNextId?: string | null;
    skippedBecauseAlreadyAssigned?: boolean;
    notes?: string[];
};
export declare class AutoAssignService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getByPath;
    private findUserByEmail;
    private findUserByName;
    private nextSetterRoundRobin;
    private matchesRuleValue;
    apply(args: ApplyArgs): Promise<ApplyResult>;
}
export {};
