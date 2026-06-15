import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { FulfillmentModule } from './fulfillment/fulfillment.module';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [DatabaseModule, HealthModule, FulfillmentModule, ProductsModule],
})
export class AppModule {}
