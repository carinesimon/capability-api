import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly admin;
    constructor(admin: AdminService);
    seedDemo(days?: string, setters?: string, closers?: string, leads?: string): Promise<{
        message: string;
        summary: {
            setters: number;
            closers: number;
            leads: number;
            rv0: number;
            rv1: number;
            rv2: number;
            sales: number;
            revenue: number;
        };
    }>;
    seedDemoOpen(days?: string, setters?: string, closers?: string, leads?: string): Promise<{
        message: string;
        summary: {
            setters: number;
            closers: number;
            leads: number;
            rv0: number;
            rv1: number;
            rv2: number;
            sales: number;
            revenue: number;
        };
    }>;
}
