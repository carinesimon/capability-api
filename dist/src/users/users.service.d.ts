import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        firstName: string;
        lastName?: string;
        email: string;
        role: Role;
    }): Promise<{
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
    }>;
    findAll(): Promise<{
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
    }[]>;
}
