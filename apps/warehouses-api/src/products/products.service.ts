import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProductResponse } from '@repo/schemas';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string): Promise<ProductResponse> {
    const product = await this.prisma.client.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    const { id: productId, sku, name, unitPrice } = product;

    return {
      id: productId,
      sku,
      name,
      unitPrice: Number(unitPrice),
    };
  }

  async listCatalog() {
    const products = await this.prisma.client.product.findMany({
      orderBy: { name: 'asc' },
    });

    const inventoryMaxes = await this.prisma.client.warehouseInventory.groupBy({
      by: ['productId'],
      _max: { quantity: true },
    });

    const quantityByProductId = new Map(
      inventoryMaxes.map(({ productId, _max }) => [
        productId,
        _max.quantity ?? 0,
      ]),
    );

    return {
      data: products.map(({ id, sku, name, unitPrice }) => ({
        id,
        sku,
        name,
        unitPrice: Number(unitPrice),
        availableQuantity: quantityByProductId.get(id) ?? 0,
      })),
    };
  }
}
