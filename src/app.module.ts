import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { LeadsModule } from './modules/leads/leads.module';

import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
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

// ✅ tu avais déjà un dossier "modules", donc on garde ça
import { MetricsModule } from './modules/metrics/metrics.module';

// tu avais ajouté ce contrôleur alias
import { LeadsAliasController } from './leads/leads-alias.controller';

@Module({
  imports: [
    PrismaModule,          // doit être importé une seule fois
    AuthModule,
    UsersModule,
    LeadsModule,           // ✅ chemin corrigé
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
  controllers: [
    AppController,
    LeadsAliasController,
  ],
  providers: [AppService],
})
export class AppModule {}
