import { AdminUsersService } from "./admin-users.service";
import { AdminUsersQueryDto, AdminCreateUserDto, AdminUpdateUserDto } from "./dto/admin-users.dto";
export declare class AdminUsersController {
    private service;
    constructor(service: AdminUsersService);
    list(q: AdminUsersQueryDto): Promise<{
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
    create(dto: AdminCreateUserDto): Promise<{
        ok: boolean;
        id: string;
    }>;
    update(id: string, dto: AdminUpdateUserDto): Promise<{
        ok: boolean;
    }>;
}
