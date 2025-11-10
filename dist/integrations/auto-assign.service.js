"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoAssignService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let AutoAssignService = class AutoAssignService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getByPath(obj, path) {
        if (!path)
            return undefined;
        try {
            return path.split('.').reduce((acc, k) => (acc != null ? acc[k] : undefined), obj);
        }
        catch {
            return undefined;
        }
    }
    async findUserByEmail(email, role) {
        if (!email)
            return null;
        const u = await this.prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' }, role, isActive: true },
            select: { id: true },
        });
        return u;
    }
    async findUserByName(name, role) {
        if (!name)
            return null;
        const token = String(name).trim();
        if (!token)
            return null;
        const u = await this.prisma.user.findFirst({
            where: {
                role, isActive: true,
                OR: [
                    { firstName: { contains: token, mode: 'insensitive' } },
                    { lastName: { contains: token, mode: 'insensitive' } },
                ],
            },
            orderBy: [{ firstName: 'asc' }],
            select: { id: true },
        });
        return u;
    }
    async nextSetterRoundRobin(prevId) {
        const setters = await this.prisma.user.findMany({
            where: { role: client_1.Role.SETTER, isActive: true },
            orderBy: [{ firstName: 'asc' }],
            select: { id: true },
        });
        if (!setters.length)
            return null;
        if (!prevId)
            return setters[0];
        const idx = setters.findIndex((u) => u.id === prevId);
        const nextIdx = idx >= 0 ? (idx + 1) % setters.length : 0;
        return setters[nextIdx];
    }
    matchesRuleValue(sourceVal, match) {
        if (!match)
            return true;
        const s = String(sourceVal ?? '');
        if (match.equals != null)
            return s === match.equals;
        if (match.contains != null)
            return s.toLowerCase().includes(String(match.contains).toLowerCase());
        if (match.regex) {
            try {
                const m = match.regex.startsWith('/') && match.regex.lastIndexOf('/') > 0
                    ? match.regex.slice(1, match.regex.lastIndexOf('/'))
                    : match.regex;
                const flags = /\/([gimsuy]*)$/.exec(match.regex)?.[1] ?? 'i';
                const re = new RegExp(m, flags);
                return re.test(s);
            }
            catch {
                return false;
            }
        }
        return false;
    }
    async apply(args) {
        const { automation, payload, dryRun } = args;
        const notes = [];
        const result = { notes };
        const lead = await this.prisma.lead.findUnique({
            where: { id: args.leadId },
            select: { id: true, setterId: true, closerId: true },
        });
        if (!lead) {
            notes.push('Lead introuvable.');
            return result;
        }
        const cfg = automation?.mappingJson?.assign ?? {};
        const overwrite = Boolean(cfg?.overwrite ?? false);
        const roundRobinEnabled = Boolean(cfg?.roundRobin?.setter ?? true);
        const rules = Array.isArray(cfg?.rules) ? cfg.rules : [];
        for (let i = 0; i < rules.length; i++) {
            const r = rules[i];
            const role = r.role === 'CLOSER' ? client_1.Role.CLOSER : client_1.Role.SETTER;
            if (r.by === 'email') {
                const v = this.getByPath(payload, r.from);
                if (v == null)
                    continue;
                const user = await this.findUserByEmail(String(v), role);
                if (!user)
                    continue;
                result.matchedRuleIndex = i;
                result.matchedRule = r;
                if (role === client_1.Role.SETTER)
                    result.assignedSetterId = user.id;
                else
                    result.assignedCloserId = user.id;
                notes.push(`Règle #${i + 1} (email→${role}) a matché: ${v}`);
                break;
            }
            if (r.by === 'name') {
                const v = this.getByPath(payload, r.from);
                if (v == null)
                    continue;
                const user = await this.findUserByName(String(v), role);
                if (!user)
                    continue;
                result.matchedRuleIndex = i;
                result.matchedRule = r;
                if (role === client_1.Role.SETTER)
                    result.assignedSetterId = user.id;
                else
                    result.assignedCloserId = user.id;
                notes.push(`Règle #${i + 1} (name→${role}) a matché: ${v}`);
                break;
            }
            if (r.by === 'static') {
                const src = this.getByPath(payload, r.from);
                if (!this.matchesRuleValue(src, r.match))
                    continue;
                if (!r.userId)
                    continue;
                const user = await this.prisma.user.findFirst({
                    where: { id: r.userId, role, isActive: true },
                    select: { id: true },
                });
                if (!user)
                    continue;
                result.matchedRuleIndex = i;
                result.matchedRule = r;
                if (role === client_1.Role.SETTER)
                    result.assignedSetterId = user.id;
                else
                    result.assignedCloserId = user.id;
                notes.push(`Règle #${i + 1} (static→${role}) a matché.`);
                break;
            }
        }
        if (!result.assignedSetterId && roundRobinEnabled) {
            const prev = automation?.metaJson?.roundRobin?.lastSetterId ?? null;
            const next = await this.nextSetterRoundRobin(prev);
            if (next) {
                result.assignedSetterId = next.id;
                result.usedRoundRobin = true;
                result.roundRobinNextId = next.id;
                notes.push(`Round-robin SETTER → ${next.id}`);
            }
            else {
                notes.push('Round-robin SETTER impossible (aucun setter actif).');
            }
        }
        const patch = {};
        const shouldSetSetter = result.assignedSetterId &&
            (overwrite || !lead.setterId || lead.setterId === result.assignedSetterId);
        const shouldSetCloser = result.assignedCloserId &&
            (overwrite || !lead.closerId || lead.closerId === result.assignedCloserId);
        if (!overwrite && (lead.setterId || lead.closerId)) {
            result.skippedBecauseAlreadyAssigned = true;
            notes.push('Assignation ignorée (overwrite=false et lead déjà assigné).');
        }
        if (shouldSetSetter) {
            patch.setter = { connect: { id: result.assignedSetterId } };
        }
        if (shouldSetCloser) {
            patch.closer = { connect: { id: result.assignedCloserId } };
        }
        if (!dryRun && (shouldSetSetter || shouldSetCloser)) {
            await this.prisma.lead.update({ where: { id: lead.id }, data: patch });
            notes.push('Lead mis à jour (assignation appliquée).');
        }
        else if (dryRun) {
            notes.push('Dry-run: aucune écriture en base.');
        }
        if (!dryRun && result.usedRoundRobin && result.roundRobinNextId) {
            const nextMeta = {
                ...(automation.metaJson || {}),
                roundRobin: { ...(automation.metaJson?.roundRobin || {}), lastSetterId: result.roundRobinNextId },
            };
            await this.prisma.automation.update({
                where: { id: automation.id },
                data: { metaJson: nextMeta },
            });
            notes.push('Round-robin checkpoint (automation.metaJson) enregistré.');
        }
        return result;
    }
};
exports.AutoAssignService = AutoAssignService;
exports.AutoAssignService = AutoAssignService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AutoAssignService);
//# sourceMappingURL=auto-assign.service.js.map