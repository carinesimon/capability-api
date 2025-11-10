import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Créer un utilisateur
  async create(data: { firstName: string; lastName?: string; email: string; role: Role }) {
    return this.prisma.user.create({ data });
  }

  // Récupérer tous les utilisateurs
  async findAll() {
    return this.prisma.user.findMany();
  }
}
