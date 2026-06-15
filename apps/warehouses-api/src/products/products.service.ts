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
}
