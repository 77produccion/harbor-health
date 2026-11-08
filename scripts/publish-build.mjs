import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
await import('./build-assets.mjs');
const result = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url)), 'build'], {
  stdio: 'inherit', env: { ...process.env, HARBOR_PUBLISH: 'true' },
});
process.exitCode = result.status ?? 1;
