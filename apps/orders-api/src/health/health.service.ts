import { Injectable } from '@nestjs/common';
import { checkDatabaseHealth, type HealthCheckResult } from '@repo/database';

type DependencyHealth = HealthCheckResult;

@Injectable()
export class HealthService {
  async getHealth() {
    const { DATABASE_URL, WAREHOUSES_API_URL, PAYMENTS_API_URL } = process.env;
    const dbHealth = await checkDatabaseHealth(DATABASE_URL);
    const dependencies = {
      warehouses: await this.fetchDependencyHealth(WAREHOUSES_API_URL),
      payments: await this.fetchDependencyHealth(PAYMENTS_API_URL),
    };
    const allOk =
      dbHealth.status === 'ok' &&
      dependencies.warehouses.status === 'ok' &&
      dependencies.payments.status === 'ok';

    return {
      status: allOk ? 'ok' : 'error',
      db: dbHealth.db,
      ...(dbHealth.error ? { error: dbHealth.error } : {}),
      dependencies,
    };
  }

  private async fetchDependencyHealth(
    baseUrl: string | undefined,
  ): Promise<DependencyHealth> {
    if (!baseUrl) {
      return {
        status: 'error',
        db: 'disconnected',
        error: 'Service URL is required',
      };
    }

    try {
      const response = await fetch(`${baseUrl}/health`);

      if (!response.ok) {
        return {
          status: 'error',
          db: 'disconnected',
          error: `HTTP ${response.status}`,
        };
      }

      return (await response.json()) as DependencyHealth;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown fetch error';
      return { status: 'error', db: 'disconnected', error: message };
    }
  }
}
