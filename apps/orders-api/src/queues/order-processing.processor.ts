import { Logger } from '@nestjs/common';
import {
  OrderStatus,
  PaymentAuthorizationStatus,
  Prisma,
  type PrismaClient,
} from '@repo/database';
import type {
  EvaluateFulfillmentRequest,
  OrderProcessingMessage,
  OrderProcessingPayment,
} from '@repo/schemas';
import {
  PaymentAuthorizationConflictError,
  PaymentsClient,
} from '../payments/payments.client';
import { WarehousesClient } from '../warehouses/warehouses.client';

const orderWithItemsInclude = {
  items: true,
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof orderWithItemsInclude;
}>;

const terminalStatuses = new Set<OrderStatus>([
  OrderStatus.PAYMENT_COMPLETE,
  OrderStatus.UNFULFILLABLE,
  OrderStatus.PAYMENT_FAILED,
  OrderStatus.CANCELLED,
]);

export class OrderProcessingProcessor {
  private readonly warehousesClient = new WarehousesClient();
  private readonly paymentsClient = new PaymentsClient();

  constructor(private readonly prisma: PrismaClient) {}

  async process(message: OrderProcessingMessage): Promise<void> {
    const { orderId, payment } = message;
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderWithItemsInclude,
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (terminalStatuses.has(order.status)) {
      Logger.log(
        `Skipping order processing orderId=${orderId} status=${order.status}`,
        'OrderProcessingConsumer',
      );
      return;
    }

    if (order.status === OrderStatus.FULFILLABLE) {
      await this.authorizePayment(order, payment);
      return;
    }

    if (order.status === OrderStatus.PENDING) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PROCESSING },
      });
    }

    const fulfillmentRequest = this.buildFulfillmentRequest(order);
    const fulfillment = await this.warehousesClient.evaluateFulfillment(fulfillmentRequest);

    if (fulfillment.status === 'UNFULFILLABLE') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.UNFULFILLABLE,
          unfulfillableReason: fulfillment.reason,
        },
      });
      return;
    }

    const {
      warehouseId,
      warehouseName,
      distanceKm,
      estimatedShipment,
    } = fulfillment;

    const fulfillableOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.FULFILLABLE,
        warehouseId,
        warehouseName,
        distanceKm: distanceKm.toFixed(3),
        estimatedShipment,
        unfulfillableReason: null,
      },
      include: orderWithItemsInclude,
    });

    await this.authorizePayment(fulfillableOrder, payment);
  }

  private buildFulfillmentRequest(order: OrderWithItems): EvaluateFulfillmentRequest {
    const {
      shippingLine1,
      shippingLine2,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry,
      items,
    } = order;

    return {
      shippingAddress: {
        line1: shippingLine1,
        line2: shippingLine2 ?? undefined,
        city: shippingCity,
        state: shippingState,
        postalCode: shippingPostalCode,
        country: shippingCountry,
      },
      items: items.map(({ productId, quantity }) => ({
        productId,
        quantity,
      })),
    };
  }

  private async authorizePayment(
    order: OrderWithItems,
    payment: OrderProcessingPayment,
  ): Promise<void> {
    const { id: orderId, totalAmount } = order;
    const existingAuthorization = await this.prisma.paymentAuthorization.findUnique({
      where: { orderId },
    });

    if (existingAuthorization) {
      await this.syncOrderStatusFromAuthorization(order, existingAuthorization.status);
      return;
    }

    const { cardNumber, description } = payment;

    try {
      const response = await this.paymentsClient.authorize({
        orderId,
        amount: Number(totalAmount),
        cardNumber,
        description,
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status:
            response.status === 'AUTHORIZED'
              ? OrderStatus.PAYMENT_COMPLETE
              : OrderStatus.PAYMENT_FAILED,
        },
      });
    } catch (error) {
      if (error instanceof PaymentAuthorizationConflictError) {
        const authorization = await this.prisma.paymentAuthorization.findUnique({
          where: { orderId },
        });

        if (!authorization) {
          throw error;
        }

        await this.syncOrderStatusFromAuthorization(order, authorization.status);
        return;
      }

      throw error;
    }
  }

  private async syncOrderStatusFromAuthorization(
    order: OrderWithItems,
    authorizationStatus: PaymentAuthorizationStatus,
  ): Promise<void> {
    const { id: orderId, status } = order;
    const targetStatus =
      authorizationStatus === PaymentAuthorizationStatus.AUTHORIZED
        ? OrderStatus.PAYMENT_COMPLETE
        : OrderStatus.PAYMENT_FAILED;

    if (status === targetStatus) {
      return;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: targetStatus },
    });
  }
}
