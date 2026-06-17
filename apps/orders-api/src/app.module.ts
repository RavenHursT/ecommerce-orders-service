import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './orders/orders.module';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [DatabaseModule, HealthModule, QueuesModule, OrdersModule],
})
export class AppModule {}
