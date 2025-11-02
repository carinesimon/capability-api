// src/leads/leads-alias.controller.ts
import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Param,
  Req,
  Res,
  Body,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { PrismaService } from "../prisma/prisma.service";

// mapping des events envoyés par le FRONT (en anglais)
// vers tes stages internes (en français) utilisés dans tes colonnes
const EVENT_TO_STAGE: Record<string, string> = {
  LEAD_CREATED: "LEAD_RECU",

  CALL_REQUESTED: "DEMANDE_APPEL",
  CALL_ATTEMPT: "APPEL_PASSE",
  CALL_ANSWERED: "APPEL_REPONDU",
  SETTER_NO_SHOW: "NO_SHOW_SETTER",
  FOLLOW_UP: "FOLLOW_UP",

  APPOINTMENT_PLANNED_RV0: "RV0_PLANIFIE",
  APPOINTMENT_HONORED_RV0: "RV0_HONORE",
  APPOINTMENT_NOSHOW_RV0: "RV0_NO_SHOW",

  APPOINTMENT_PLANNED_RV1: "RV1_PLANIFIE",
  APPOINTMENT_HONORED_RV1: "RV1_HONORE",
  APPOINTMENT_NOSHOW_RV1: "RV1_NO_SHOW",
  APPOINTMENT_POSTPONED_RV1: "RV1_NO_SHOW", // adapte si tu as un vrai "REPORTÉ"

  APPOINTMENT_PLANNED_RV2: "RV2_PLANIFIE",
  APPOINTMENT_HONORED_RV2: "RV2_HONORE",
  APPOINTMENT_NOSHOW_RV2: "RV2_NO_SHOW", // seulement si tu l'as dans l'enum

  NOT_QUALIFIED: "NOT_QUALIFIED",
  LOST: "LOST",
  WON: "WON",
};

@Controller("leads")
export class LeadsAliasController {
  constructor(private readonly prisma: PrismaService) {}

  // petit helper pour proxifier vers /prospects/...
  private forward(req: Request, res: Response, target: string) {
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return res.redirect(307, target + qs);
  }

  // ===== BOARD =====
  @Get("board")
  getBoard(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, "/prospects/board");
  }

  // ===== COLONNES =====
  @Get("columns-config")
  getColumns(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, "/prospects/columns-config");
  }

  @Put("columns-config")
  saveColumns(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, "/prospects/columns-config");
  }

  // ===== ACTEURS =====
  @Get("actors")
  getActors(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, "/prospects/actors");
  }

  // ===== CRUD LEADS =====
  @Post()
  createLead(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, "/prospects");
  }

  @Get(":id")
  getLead(@Req() req: Request, @Res() res: Response, @Param("id") id: string) {
    return this.forward(req, res, `/prospects/${id}`);
  }

  @Patch(":id")
  updateLead(@Req() req: Request, @Res() res: Response, @Param("id") id: string) {
    return this.forward(req, res, `/prospects/${id}`);
  }

  @Delete(":id")
  deleteLead(@Req() req: Request, @Res() res: Response, @Param("id") id: string) {
    return this.forward(req, res, `/prospects/${id}`);
  }

  // ===== STAGE =====
  @Post(":id/stage")
  changeStagePOST(@Req() req: Request, @Res() res: Response, @Param("id") id: string) {
    return this.forward(req, res, `/prospects/${id}/stage`);
  }

  @Patch(":id/stage")
  changeStagePATCH(@Req() req: Request, @Res() res: Response, @Param("id") id: string) {
    return this.forward(req, res, `/prospects/${id}/stage`);
  }

  // ===== BOARD COLUMN LIBRE =====
  @Post(":id/board")
  moveToBoard(@Req() req: Request, @Res() res: Response, @Param("id") id: string) {
    return this.forward(req, res, `/prospects/${id}/board`);
  }

  // ===== EVENTS (avale + enregistre dans l'historique si possible) =====
  @Post(":id/events")
  async addEvent(
    @Param("id") id: string,
    @Body() body: any,
  ) {
    const type = body?.type as string | undefined;
    const occurredAt = body?.occurredAt ? new Date(body.occurredAt) : new Date();

    if (type) {
      const stage = EVENT_TO_STAGE[type];
      if (stage) {
        // on enregistre "ce lead est passé au moins une fois dans ce stage"
        // ⚠️ nécessite le model Prisma suivant :
        // model LeadStageHistory {
        //   id         String   @id @default(cuid())
        //   leadId     String
        //   stage      String
        //   occurredAt DateTime @default(now())
        //   @@unique([leadId, stage], name: "lead_stage_unique")
        // }
        try {
          // on passe par l'indexation pour ne pas faire râler TS si le modèle n'est pas encore généré
          await (this.prisma as any).leadStageHistory.upsert({
            where: {
              lead_stage_unique: {
                leadId: id,
                stage,
              },
            },
            update: {},
            create: {
              leadId: id,
              stage,
              occurredAt,
            },
          });
        } catch (e) {
          // on ne casse PAS le drag&drop si la table n'existe pas encore
        }
      }
    }

    // on répond toujours OK pour le front
    return {
      ok: true,
      leadId: id,
      received: body ?? null,
    };
  }
}
