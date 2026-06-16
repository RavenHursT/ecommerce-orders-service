import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@repo/database';
import type {
  CancelOrderResponse,
  CreateOrderRequest,
  ListOrdersQuery,
  OrderResponse,
  PaginatedOrdersResponse,
  UpdateOrderRequest,
} from '@repo/schemas';
import { WarehousesClient } from '../warehouses/warehouses.client';
import { OrdersRepository, type OrderWithItems } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly warehousesClient: WarehousesClient,
  ) {}

  async list(query: ListOrdersQuery): Promise<PaginatedOrdersResponse> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.ordersRepository.findMany({ skip, take: limit }),
      this.ordersRepository.count(),
    ]);

    return {
      data: orders.map((order) => this.toOrderResponse(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string): Promise<OrderResponse> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return this.toOrderResponse(order);
  }

  async create(request: CreateOrderRequest): Promise<OrderResponse> {
    const { customer, shippingAddress, items } = request;
    const uniqueProductIds = new Set(items.map(({ productId }) => productId));

    if (uniqueProductIds.size !== items.length) {
      throw new BadRequestException('Duplicate productId values are not allowed in items');
    }

    const pricedItems = await Promise.all(
      items.map(async ({ productId, quantity }) => {
        const product = await this.warehousesClient.getProduct(productId);
        const { unitPrice } = product;

        return {
          productId,
          quantity,
          unitPrice,
        };
      }),
    );

    const totalAmount = pricedItems
      .reduce((sum, { quantity, unitPrice }) => sum + quantity * unitPrice, 0)
      .toFixed(2);

    const {
      line1,
      line2,
      city,
      state,
      postalCode,
      country,
    } = shippingAddress;

    const order = await this.ordersRepository.create({
      status: OrderStatus.PENDING,
      customerName: customer.name,
      customerEmail: customer.email,
      shippingLine1: line1,
      shippingLine2: line2,
      shippingCity: city,
      shippingState: state,
      shippingPostalCode: postalCode,
      shippingCountry: country,
      totalAmount,
      items: {
        create: pricedItems.map(({ productId, quantity, unitPrice }) => ({
          productId,
          quantity,
          unitPrice: unitPrice.toFixed(2),
        })),
      },
    });

    return this.toOrderResponse(order);
  }

  async update(id: string, request: UpdateOrderRequest): Promise<OrderResponse> {
    await this.requirePendingOrder(id);
    const { customer, shippingAddress } = request;
    const updateData: Prisma.OrderUpdateInput = {};

    if (customer?.name !== undefined) {
      updateData.customerName = customer.name;
    }

    if (customer?.email !== undefined) {
      updateData.customerEmail = customer.email;
    }

    if (shippingAddress?.line1 !== undefined) {
      updateData.shippingLine1 = shippingAddress.line1;
    }

    if (shippingAddress?.line2 !== undefined) {
      updateData.shippingLine2 = shippingAddress.line2;
    }

    if (shippingAddress?.city !== undefined) {
      updateData.shippingCity = shippingAddress.city;
    }

    if (shippingAddress?.state !== undefined) {
      updateData.shippingState = shippingAddress.state;
    }

    if (shippingAddress?.postalCode !== undefined) {
      updateData.shippingPostalCode = shippingAddress.postalCode;
    }

    if (shippingAddress?.country !== undefined) {
      updateData.shippingCountry = shippingAddress.country;
    }

    const updatedOrder = await this.ordersRepository.update(id, updateData);

    return this.toOrderResponse(updatedOrder);
  }

  async cancel(id: string): Promise<CancelOrderResponse> {
    await this.requirePendingOrder(id);
    await this.ordersRepository.cancel(id);

    return { status: 'CANCELLED' };
  }

  private async requirePendingOrder(id: string): Promise<OrderWithItems> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(`Order ${id} cannot be modified in status ${order.status}`);
    }

    return order;
  }

  private toOrderResponse(order: OrderWithItems): OrderResponse {
    const {
      id,
      status,
      customerName,
      customerEmail,
      shippingLine1,
      shippingLine2,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry,
      totalAmount,
      warehouseId,
      warehouseName,
      distanceKm,
      estimatedShipment,
      unfulfillableReason,
      createdAt,
      updatedAt,
      items,
    } = order;

    return {
      id,
      status,
      customer: {
        name: customerName,
        email: customerEmail,
      },
      shippingAddress: {
        line1: shippingLine1,
        line2: shippingLine2 ?? undefined,
        city: shippingCity,
        state: shippingState,
        postalCode: shippingPostalCode,
        country: shippingCountry,
      },
      totalAmount: Number(totalAmount),
      items: items.map(({ productId, quantity, unitPrice }) => ({
        productId,
        quantity,
        unitPrice: Number(unitPrice),
      })),
      ...(warehouseId ? { warehouseId } : {}),
      ...(warehouseName ? { warehouseName } : {}),
      ...(distanceKm !== null ? { distanceKm: Number(distanceKm) } : {}),
      ...(estimatedShipment
        ? { estimatedShipment: estimatedShipment as Record<string, unknown> }
        : {}),
      ...(unfulfillableReason ? { unfulfillableReason } : {}),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  }
}
