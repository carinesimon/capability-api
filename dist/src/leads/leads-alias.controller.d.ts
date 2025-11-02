import type { Request, Response } from "express";
import { PrismaService } from "../prisma/prisma.service";
export declare class LeadsAliasController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private forward;
    getBoard(req: Request, res: Response): void;
    getColumns(req: Request, res: Response): void;
    saveColumns(req: Request, res: Response): void;
    getActors(req: Request, res: Response): void;
    createLead(req: Request, res: Response): void;
    getLead(req: Request, res: Response, id: string): void;
    updateLead(req: Request, res: Response, id: string): void;
    deleteLead(req: Request, res: Response, id: string): void;
    changeStagePOST(req: Request, res: Response, id: string): void;
    changeStagePATCH(req: Request, res: Response, id: string): void;
    moveToBoard(req: Request, res: Response, id: string): void;
    addEvent(id: string, body: any): Promise<{
        ok: boolean;
        leadId: string;
        received: any;
    }>;
}
