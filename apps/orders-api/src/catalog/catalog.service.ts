import { Injectable } from '@nestjs/common';
import type { ProductCatalogResponse } from '@repo/schemas';
import { WarehousesClient } from '../warehouses/warehouses.client';

@Injectable()
export class CatalogService {
  constructor(private readonly warehousesClient: WarehousesClient) {}

  listProducts(): Promise<ProductCatalogResponse> {
    return this.warehousesClient.listProducts();
  }
}
