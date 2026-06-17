import { Module } from '@nestjs/common';
import { WarehousesClient } from '../warehouses/warehouses.client';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, WarehousesClient],
})
export class CatalogModule {}
