import { Role } from '@prisma/client';
export declare class CreateUserDto {
    firstName: string;
    lastName?: string;
    email: string;
    role: Role;
}
