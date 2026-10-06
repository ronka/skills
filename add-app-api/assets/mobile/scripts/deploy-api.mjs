#!/usr/bin/env node

// Exports the API routes, deploys them to EAS Hosting production, and confirms
// production serves the new deployment. Usage: npm run deploy:api
// First deploy: npm run deploy:api -- --dev-domain <name>  (gives <name>.expo.app)

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';

const EAS = ['--yes', 'eas-cli@24.7.0'];
// Without this, Expo uploads values found only in .env files, so development
// keys would reach production. Production values come from EAS env only.
const env = {
  ...process.env,
  EXPO_NO_DOTENV: '1',
  EXPO_EXPORT_API_ROUTES: '1',
  EXPO_NO_WEB_SETUP: '1',
};

// Because .env files are skipped, every server variable must exist in EAS
// production. .env.example lists them; EXPO_PUBLIC_ values ship in app builds instead.
const required = existsSync('.env.example')
  ? [...readFileSync('.env.example', 'utf8').matchAll(/^([A-Z][A-Z0-9_]*)=/gm)]
      .map((match) => match[1])
      .filter((name) => !name.startsWith('EXPO_PUBLIC_'))
  : [];
if (required.length) {
  const listed = execFileSync('npx', [...EAS, 'env:list', 'production', '--format', 'short'], {
    env,
    stdio: ['inherit', 'pipe', 'inherit'],
  }).toString();
  // Names only; values are never printed.
  const present = new Set([...listed.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1]));
  const missing = required.filter((name) => !present.has(name));
  if (missing.length) {
    console.error(
      `EAS production is missing ${missing.join(', ')}. Push them with sensitive visibility ` +
        '(add-app-api step 4: npx --yes eas-cli@24.7.0 env:push production --path <file>), then deploy again.',
    );
    process.exit(1);
  }
}

rmSync('dist', { recursive: true, force: true });
execFileSync('npx', ['expo', 'export', '--platform', 'web'], { env, stdio: 'inherit' });

const output = execFileSync(
  'npx',
  [...EAS, 'deploy', '--prod', '--environment', 'production', '--json', '--non-interactive', ...process.argv.slice(2)],
  { env, stdio: ['inherit', 'pipe', 'inherit'] },
).toString();
const deployment = JSON.parse(output.slice(output.indexOf('{')));
const deploymentHost = new URL(deployment.url).host;
const productionUrl = deployment.production?.url;
if (!productionUrl) {
  console.error('EAS did not report a production URL. Check the deployment in the EAS dashboard.');
  process.exit(1);
}

// `eas deploy --prod` can report a promotion that didn't happen (expo/eas-cli#4388),
// so wait until production's health route answers from the new deployment.
let served = null;
for (let attempt = 0; attempt < 18; attempt += 1) {
  try {
    const response = await fetch(`${productionUrl}/health`, { cache: 'no-store' });
    if (response.status === 404) {
      console.error('Production has no /health route. Restore src/app/health+api.ts and deploy again.');
      process.exit(1);
    }
    served = (await response.json()).deployment;
    if (served === deploymentHost) break;
  } catch {
    // Not reachable yet; try again.
  }
  await new Promise((resolve) => setTimeout(resolve, 10_000));
}

if (served !== deploymentHost) {
  console.error(
    `Production still serves ${served ?? 'nothing'} instead of ${deploymentHost}. Run npm run deploy:api again.`,
  );
  process.exit(1);
}
console.log(`Production ${productionUrl} serves deployment ${deploymentHost}.`);

const app = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const router = (app.plugins ?? []).find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-router');
const origin = router?.[1]?.origin;
if (origin !== productionUrl) {
  console.warn(
    `\nRelease builds can't reach this API until app.json sets the expo-router plugin origin:\n` +
      `  ["expo-router", { "origin": "${productionUrl}" }]\n` +
      `Currently: ${origin ?? 'not set'}. Release builds read it at build time, so rebuild after changing it.`,
  );
  process.exitCode = 2;
}
