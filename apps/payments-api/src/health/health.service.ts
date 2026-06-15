import { Injectable } from '@nestjs/common';
import { checkDatabaseHealth } from '@repo/database';

@Injectable()
export class HealthService {
  async getHealth() {
    const { DATABASE_URL } = process.env;
    return checkDatabaseHealth(DATABASE_URL);
  }
}
