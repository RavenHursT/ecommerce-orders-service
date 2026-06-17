import { Module } from '@nestjs/common';
import { QueuesModule } from '../queues/queues.module';
import { WarehousesClient } from '../warehouses/warehouses.client';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [QueuesModule],
  controllers: [OrdersController],
  providers: [OrdersRepository, OrdersService, WarehousesClient],
})
export class OrdersModule {}
