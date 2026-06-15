import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';

export function loadMonorepoEnv(): void {
  const candidates = [
    resolve(process.cwd(), '../..'),
    resolve(__dirname, '../../../..'),
    resolve(__dirname, '../../..'),
  ];
  const monorepoRoot = candidates.find((dir) =>
    existsSync(resolve(dir, '.env.local')),
  );

  if (!monorepoRoot) {
    return;
  }

  config({ path: resolve(monorepoRoot, '.env.local'), override: true });
}
