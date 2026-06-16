import { Module } from '@nestjs/common';
import { WarehousesClient } from '../warehouses/warehouses.client';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersRepository, OrdersService, WarehousesClient],
})
export class OrdersModule {}
