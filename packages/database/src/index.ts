import pg from 'pg';

export async function pingDatabase(connectionString: string): Promise<void> {
  const pool = new pg.Pool({ connectionString });

  try {
    await pool.query('SELECT 1');
  } finally {
    await pool.end();
  }
}

export type HealthCheckResult = {
  status: 'ok' | 'error';
  db: 'connected' | 'disconnected';
  error?: string;
};

export async function checkDatabaseHealth(
  connectionString: string | undefined,
): Promise<HealthCheckResult> {
  if (!connectionString) {
    return {
      status: 'error',
      db: 'disconnected',
      error: 'DATABASE_URL is required',
    };
  }

  try {
    await pingDatabase(connectionString);
    return { status: 'ok', db: 'connected' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return { status: 'error', db: 'disconnected', error: message };
  }
}
