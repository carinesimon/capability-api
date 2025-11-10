// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Active des logs verbeux en dev, silencieux en prod
    super({
      log:
        process.env.NODE_ENV === 'production'
          ? ['warn', 'error']
          : ['query', 'info', 'warn', 'error'],
    });

    // ⚠️ Si vous aviez des middlewares Prisma, vous pouvez les remettre ici.
    // Exemple (laissez commenté si vous n’en avez pas besoin) :
    // this.$use(async (params, next) => {
    //   return next(params);
    // });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
