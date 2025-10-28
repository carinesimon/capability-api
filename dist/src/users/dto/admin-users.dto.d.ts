export declare class AdminUsersQueryDto {
    q?: string;
    role?: 'ADMIN' | 'SETTER' | 'CLOSER';
    isActive?: 'true' | 'false';
    page?: string;
    pageSize?: string;
}
export declare class AdminCreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    role: 'ADMIN' | 'SETTER' | 'CLOSER';
    isActive?: boolean;
    tempPassword?: string;
}
export declare class AdminUpdateUserDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: 'ADMIN' | 'SETTER' | 'CLOSER';
    isActive?: boolean;
    tempPassword?: string;
}
