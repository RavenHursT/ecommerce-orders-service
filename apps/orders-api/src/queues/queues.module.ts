import { Module } from '@nestjs/common';
import { OrderProcessingPublisher } from './order-processing.publisher';

@Module({
  providers: [OrderProcessingPublisher],
  exports: [OrderProcessingPublisher],
})
export class QueuesModule {}
