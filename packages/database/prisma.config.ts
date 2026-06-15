import { config } from 'dotenv';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

const monorepoRoot = resolve(__dirname, '../..');

config({ path: resolve(monorepoRoot, '.env.example') });
config({ path: resolve(monorepoRoot, '.env.local') });

const directUrl =
  process.env.DIRECT_URL ??
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: directUrl,
  },
});
