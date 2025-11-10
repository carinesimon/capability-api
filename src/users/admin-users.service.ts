import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async list(params: {
    q?: string; role?: 'ADMIN'|'SETTER'|'CLOSER'; isActive?: boolean; page: number; pageSize: number;
  }) {
    const { q, role, isActive, page, pageSize } = params;
    const where: any = {};
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName:  { contains: q, mode: "insensitive" } },
        { email:     { contains: q, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role;
    if (typeof isActive === "boolean") where.isActive = isActive;

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

  async create(data: {
    firstName: string; lastName: string; email: string;
    role: 'ADMIN'|'SETTER'|'CLOSER'; isActive?: boolean; tempPassword?: string;
  }) {
    const email = data.email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException("Email déjà utilisé");

    let passwordHash: string | undefined;
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

  async update(id: string, patch: {
    firstName?: string; lastName?: string; email?: string;
    role?: 'ADMIN'|'SETTER'|'CLOSER'; isActive?: boolean; tempPassword?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    const data: any = {};
    if (patch.firstName != null) data.firstName = patch.firstName.trim();
    if (patch.lastName  != null) data.lastName  = patch.lastName.trim();
    if (patch.email     != null) {
      const email = patch.email.trim().toLowerCase();
      if (email !== user.email) {
        const dupe = await this.prisma.user.findUnique({ where: { email } });
        if (dupe) throw new BadRequestException("Email déjà utilisé");
      }
      data.email = email;
    }
    if (patch.role != null) data.role = patch.role;
    if (patch.isActive != null) data.isActive = patch.isActive;
    if (patch.tempPassword) data.passwordHash = await bcrypt.hash(patch.tempPassword, 10);

    await this.prisma.user.update({ where: { id }, data });
    return { ok: true };
  }
  
}
