import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [DatabaseModule, HealthModule, OrdersModule],
})
export class AppModule {}
