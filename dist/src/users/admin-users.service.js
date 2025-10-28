"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AdminUsersService = class AdminUsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(params) {
        const { q, role, isActive, page, pageSize } = params;
        const where = {};
        if (q) {
            where.OR = [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
            ];
        }
        if (role)
            where.role = role;
        if (typeof isActive === "boolean")
            where.isActive = isActive;
        const [items, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where,
                orderBy: [{ createdAt: "desc" }],
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true, firstName: true, lastName: true, email: true,
                    role: true, isActive: true, createdAt: true, updatedAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
    async create(data) {
        const email = data.email.trim().toLowerCase();
        const exists = await this.prisma.user.findUnique({ where: { email } });
        if (exists)
            throw new common_1.BadRequestException("Email déjà utilisé");
        let passwordHash;
        if (data.tempPassword) {
            passwordHash = await bcrypt.hash(data.tempPassword, 10);
        }
        const user = await this.prisma.user.create({
            data: {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                email,
                role: data.role,
                isActive: data.isActive ?? true,
                ...(passwordHash ? { passwordHash } : {}),
            },
            select: { id: true },
        });
        return { ok: true, id: user.id };
    }
    async update(id, patch) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException("Utilisateur introuvable");
        const data = {};
        if (patch.firstName != null)
            data.firstName = patch.firstName.trim();
        if (patch.lastName != null)
            data.lastName = patch.lastName.trim();
        if (patch.email != null) {
            const email = patch.email.trim().toLowerCase();
            if (email !== user.email) {
                const dupe = await this.prisma.user.findUnique({ where: { email } });
                if (dupe)
                    throw new common_1.BadRequestException("Email déjà utilisé");
            }
            data.email = email;
        }
        if (patch.role != null)
            data.role = patch.role;
        if (patch.isActive != null)
            data.isActive = patch.isActive;
        if (patch.tempPassword)
            data.passwordHash = await bcrypt.hash(patch.tempPassword, 10);
        await this.prisma.user.update({ where: { id }, data });
        return { ok: true };
    }
};
exports.AdminUsersService = AdminUsersService;
exports.AdminUsersService = AdminUsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminUsersService);
//# sourceMappingURL=admin-users.service.js.map