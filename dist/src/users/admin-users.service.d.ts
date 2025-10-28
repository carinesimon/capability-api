import { PrismaService } from "../prisma/prisma.service";
export declare class AdminUsersService {
    private prisma;
    constructor(prisma: PrismaService);
    list(params: {
        q?: string;
        role?: 'ADMIN' | 'SETTER' | 'CLOSER';
        isActive?: boolean;
        page: number;
        pageSize: number;
    }): Promise<{
        items: {
            id: string;
            email: string;
            firstName: string;
            lastName: string | null;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(data: {
        firstName: string;
        lastName: string;
        email: string;
        role: 'ADMIN' | 'SETTER' | 'CLOSER';
        isActive?: boolean;
        tempPassword?: string;
    }): Promise<{
        ok: boolean;
        id: string;
    }>;
    update(id: string, patch: {
        firstName?: string;
        lastName?: string;
        email?: string;
        role?: 'ADMIN' | 'SETTER' | 'CLOSER';
        isActive?: boolean;
        tempPassword?: string;
    }): Promise<{
        ok: boolean;
    }>;
}
