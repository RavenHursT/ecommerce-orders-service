import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog/catalog.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './orders/orders.module';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [DatabaseModule, HealthModule, QueuesModule, OrdersModule, CatalogModule],
})
export class AppModule {}
