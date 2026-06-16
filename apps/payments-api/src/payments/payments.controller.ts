import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  authorizePaymentRequestSchema,
  type AuthorizePaymentRequest,
} from '@repo/schemas';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(InternalApiKeyGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('authorize')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(authorizePaymentRequestSchema))
  authorize(@Body() body: AuthorizePaymentRequest) {
    return this.paymentsService.authorize(body);
  }
}
