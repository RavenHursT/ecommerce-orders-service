import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [DatabaseModule, HealthModule, PaymentsModule],
})
export class AppModule {}
