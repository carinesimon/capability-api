import { AuthService } from './auth.service';
import { Role } from '@prisma/client';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            firstName: any;
        };
    }>;
    me(req: any): Promise<any>;
    createUser(req: any, body: {
        email: string;
        password: string;
        role: Role;
        firstName?: string;
        lastName?: string;
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string | null;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
