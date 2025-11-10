// src/modules/leads/lead-stage.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service'; // ← import relatif qui fonctionne sans alias
import * as crypto from 'crypto';

type StageMoveInput = {
  leadId: string;
  toStage: LeadStage;
  occurredAt?: Date;
  source?: string;          // "ui", "webhook:ghl", etc.
  actorId?: string | null;
  externalId?: string | null; // id unique si fourni par webhook (idempotence forte)
};

type FunnelParams = {
  start: Date;
  end: Date;
  stages?: LeadStage[];     // si non fourni => toutes
  distinctLeads?: boolean;  // si true => 1 seul comptage par lead et par stage dans la période
};

@Injectable()
export class LeadStageService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enregistre l'ENTRÉE dans un stage (event-sourcing via LeadEvent) + met à jour l'état courant du lead.
   * Idempotent via externalId (si fourni) ou via un hash stable (leadId|toStage|minute).
   *
   * NB: S'appuie sur le modèle LeadEvent (et PAS StageEvent, qui n'existe pas dans ton schéma).
   *     meta = { toStage, fromStage, source, actorId }
   */
  async recordStageEntry(input: StageMoveInput) {
    const { leadId, toStage } = input;
    const occurredAt = input.occurredAt ?? new Date();

    // Récupère le stage courant pour déterminer fromStage
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { stage: true },
    });
    if (!lead) throw new BadRequestException('Lead not found');

    const fromStage = lead.stage;

    // Idempotence: construit un ID d'évènement déterministe
    let eventId: string;
    if (input.externalId) {
      eventId = `stage-enter:${input.externalId}`;
    } else {
      // Hash stable : leadId|toStage|occurredAt_minute
      const minuteBucket = new Date(occurredAt);
      minuteBucket.setSeconds(0, 0);
      const hash = crypto
        .createHash('sha256')
        .update(`${leadId}|${toStage}|${minuteBucket.toISOString()}`)
        .digest('hex');
      eventId = `stage-enter:${hash}`;
      
    }

    // Upsert LeadEvent (type='STAGE_ENTER'); meta JSON simple et exploitable
    const event = await this.prisma.leadEvent.upsert({
      where: { id: eventId },
      create: {
        id: eventId,
        leadId,
        type: 'STAGE_ENTER',
        meta: {
          toStage,
          fromStage,
          source: input.source ?? null,
          actorId: input.actorId ?? null,
        },
        occurredAt,
      },
      update: {}, // un évènement passé ne change pas
    });

    // Mets à jour l'état courant du lead si changement
    if (fromStage !== toStage) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { stage: toStage, stageUpdatedAt: new Date() },
      });
    }

    return event;
  }

  /**
   * KPIs funnel basés EXCLUSIVEMENT sur les ENTRÉES de stage (type: 'STAGE_ENTER')
   * entre start (inclus) et end (exclu). Ne dépend pas du stage courant => pas de régression.
   *
   * Retourne Record<LeadStage, number>.
   */
  async getFunnelStats(params: FunnelParams): Promise<Record<LeadStage, number>> {
    const { start, end, stages, distinctLeads } = params;

    const stagesToCount: LeadStage[] =
      stages ?? (Object.values(LeadStage) as LeadStage[]);

    // Initialise la sortie à 0 pour chaque stage demandé
    const out: Record<LeadStage, number> = {} as any;
    for (const s of stagesToCount) out[s] = 0;

    // Récupère les événements d'entrée de stage dans la période
    const events = await this.prisma.leadEvent.findMany({
      where: {
        type: 'STAGE_ENTER',
        occurredAt: { gte: start, lt: end },
      },
      select: { leadId: true, meta: true },
    });

    if (!distinctLeads) {
      // Simple incrément pour chaque entrée
      for (const ev of events) {
        const meta = ev.meta as any;
        const toStage = meta?.toStage as LeadStage | undefined;
        if (toStage && stagesToCount.includes(toStage)) {
          out[toStage] = (out[toStage] ?? 0) + 1;
        }
      }
    } else {
      // Comptage DISTINCT leadId par stage
      const perStageSets = new Map<LeadStage, Set<string>>();
      for (const s of stagesToCount) perStageSets.set(s, new Set<string>());

      for (const ev of events) {
        const meta = ev.meta as any;
        const toStage = meta?.toStage as LeadStage | undefined;
        if (toStage && stagesToCount.includes(toStage)) {
          perStageSets.get(toStage)!.add(ev.leadId);
        }
      }

      for (const s of stagesToCount) {
        out[s] = perStageSets.get(s)!.size;
      }
    }

    return out;
  }
  
}

