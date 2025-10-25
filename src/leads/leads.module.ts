import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { AttributionModule } from '../attribution/attribution.module';

@Module({
  imports: [AttributionModule],
  providers: [LeadsService],
  controllers: [LeadsController],
})
export class LeadsModule {}
