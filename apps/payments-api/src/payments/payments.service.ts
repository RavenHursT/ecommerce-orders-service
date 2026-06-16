import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentAuthorizationStatus } from '@repo/database';
import type {
  AuthorizePaymentRequest,
  AuthorizePaymentResponse,
} from '@repo/schemas';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async authorize(request: AuthorizePaymentRequest): Promise<AuthorizePaymentResponse> {
    const { orderId, amount, cardNumber, description } = request;
    const cardLastFour = cardNumber.slice(-4);
    const isDeclined = cardNumber.endsWith('0000');

    const order = await this.prisma.client.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const existingAuthorization = await this.prisma.client.paymentAuthorization.findUnique({
      where: { orderId },
      select: { id: true },
    });

    if (existingAuthorization) {
      throw new ConflictException(`Payment authorization already exists for order ${orderId}`);
    }

    const authorization = await this.prisma.client.paymentAuthorization.create({
      data: {
        orderId,
        amount: amount.toFixed(2),
        cardLastFour,
        description,
        status: isDeclined
          ? PaymentAuthorizationStatus.DECLINED
          : PaymentAuthorizationStatus.AUTHORIZED,
        authorizationCode: isDeclined
          ? null
          : `AUTH-${randomBytes(4).toString('hex').toUpperCase()}`,
      },
    });

    const { id, status } = authorization;

    return status === PaymentAuthorizationStatus.DECLINED
      ? { status: 'DECLINED' }
      : {
          status: 'AUTHORIZED',
          authorizationId: id,
          cardLastFour,
        };
  }
}
