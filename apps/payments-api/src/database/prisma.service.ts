import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { createPrismaClient, PrismaClient } from '@repo/database';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client: PrismaClient;

  constructor() {
    const { DATABASE_URL } = process.env;

    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }

    this.client = createPrismaClient(DATABASE_URL);
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
