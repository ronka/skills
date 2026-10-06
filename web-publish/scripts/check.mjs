#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export function checkProject(project) {
  const checks = [];
  const add = (id, status, summary, nextAction = null) => checks.push({ id, status, summary, nextAction });
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(resolve(project, 'package.json'), 'utf8'));
    if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) throw new Error();
    add('package', 'ready', 'Package metadata is readable.');
  } catch {
    add('package', 'failed', 'Package metadata is missing or invalid.', 'Open the app root and repair package.json.');
  }
  if (pkg) {
    for (const name of ['build', 'lint']) {
      const present = typeof pkg.scripts?.[name] === 'string' && pkg.scripts[name].trim().length > 0;
      add(name, present ? 'ready' : 'needs-action', `${name} script ${present ? 'is available' : 'is missing'}.`, present ? null : `Establish the project's ${name} check.`);
    }
    const deps = existsSync(resolve(project, 'node_modules/next/package.json'));
    add('dependencies', deps ? 'ready' : 'needs-action', deps ? 'Next.js is installed; run build to verify dependencies.' : 'Next.js dependencies are missing.', deps ? null : 'Install dependencies using the project lockfile.');
  }
  const linkPath = resolve(project, '.vercel/project.json');
  if (!existsSync(linkPath)) {
    add('link', 'needs-action', 'No Vercel project is linked.', 'Choose the intended account/project and run vercel link.');
  } else {
    try {
      const link = JSON.parse(readFileSync(linkPath, 'utf8'));
      if (![link?.projectId, link?.orgId].every(value => typeof value === 'string' && value.trim())) throw new Error();
      add('link', 'ready', 'Link metadata is present; verify ownership with Vercel.');
    } catch {
      add('link', 'failed', 'Vercel link metadata is invalid.', 'Inspect .vercel/project.json and relink the intended project.');
    }
  }
  return { status: checks.some(c => c.status === 'failed') ? 'failed' : checks.some(c => c.status === 'needs-action') ? 'needs-action' : 'ready', checks };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { project: { type: 'string' } } });
    if (!values.project) throw new Error();
    const result = checkProject(resolve(values.project));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = { ready: 0, 'needs-action': 2, failed: 1 }[result.status];
  } catch {
    console.log(JSON.stringify({ status: 'failed', checks: [{ id: 'arguments', status: 'failed', summary: 'Expected --project <app-directory>.', nextAction: 'Pass the project directory.' }] }));
    process.exitCode = 1;
  }
}
