import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeadsModule } from './modules/leads/leads.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';   // ✅ Injection Prisma

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AttributionModule } from './attribution/attribution.module';
import { ReportingModule } from './reporting/reporting.module';
import { PdfExportModule } from './pdf-export/pdf-export.module';
import { ContractsModule } from './contracts/contracts.module';
import { BudgetModule } from './budget/budget.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ProspectsModule } from './prospects/prospects.module';
import { GhlModule } from './integrations/ghl/ghl.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { MetricsModule } from './modules/metrics/metrics.module';

@Module({
  imports: [
    PrismaModule,                // ✅ doit être chargé une seule fois au root
    AuthModule,
    UsersModule,
    LeadsModule,
    MetricsModule,
    AdminModule,
    AppointmentsModule,
    AttributionModule,
    ReportingModule,
    PdfExportModule,
    ContractsModule,
    BudgetModule,
    WebhooksModule,
    ProspectsModule,
    GhlModule,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
