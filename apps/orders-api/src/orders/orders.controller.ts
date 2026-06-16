import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  createOrderRequestSchema,
  listOrdersQuerySchema,
  updateOrderRequestSchema,
  type CreateOrderRequest,
  type ListOrdersQuery,
  type UpdateOrderRequest,
} from '@repo/schemas';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listOrdersQuerySchema)) query: ListOrdersQuery) {
    return this.ordersService.list(query);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getById(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body(new ZodValidationPipe(createOrderRequestSchema)) body: CreateOrderRequest) {
    return this.ordersService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateOrderRequestSchema)) body: UpdateOrderRequest,
  ) {
    return this.ordersService.update(id, body);
  }

  @Delete(':id')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.cancel(id);
  }
}
