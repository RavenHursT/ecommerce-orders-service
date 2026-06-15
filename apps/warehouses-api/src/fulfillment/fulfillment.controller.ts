import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  evaluateFulfillmentRequestSchema,
  type EvaluateFulfillmentRequest,
} from '@repo/schemas';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FulfillmentService } from './fulfillment.service';

@Controller('fulfillment')
@UseGuards(InternalApiKeyGuard)
export class FulfillmentController {
  constructor(private readonly fulfillmentService: FulfillmentService) {}

  @Post('evaluate')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(evaluateFulfillmentRequestSchema))
  evaluate(@Body() body: EvaluateFulfillmentRequest) {
    return this.fulfillmentService.evaluate(body);
  }
}
