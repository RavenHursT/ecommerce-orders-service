import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@repo/database';
import { PrismaService } from '../database/prisma.service';

const orderWithItemsInclude = {
  items: true,
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof orderWithItemsInclude;
}>;

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: { skip: number; take: number }) {
    const { skip, take } = params;

    return this.prisma.client.order.findMany({
      skip,
      take,
      include: orderWithItemsInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  count() {
    return this.prisma.client.order.count();
  }

  findById(id: string) {
    return this.prisma.client.order.findUnique({
      where: { id },
      include: orderWithItemsInclude,
    });
  }

  create(data: Prisma.OrderCreateInput) {
    return this.prisma.client.order.create({
      data,
      include: orderWithItemsInclude,
    });
  }

  update(id: string, data: Prisma.OrderUpdateInput) {
    return this.prisma.client.order.update({
      where: { id },
      data,
      include: orderWithItemsInclude,
    });
  }

  cancel(id: string) {
    return this.prisma.client.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: orderWithItemsInclude,
    });
  }
}
