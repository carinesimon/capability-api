import { PrismaService } from '../prisma/prisma.service';
type SeedOpts = {
    days: number;
    setters: number;
    closers: number;
    leads: number;
};
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    seedDemo({ days, setters, closers, leads }: SeedOpts): Promise<{
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
export {};
