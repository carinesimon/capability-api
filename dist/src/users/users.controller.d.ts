import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(body: CreateUserDto): Promise<{
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
