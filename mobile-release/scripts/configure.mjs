#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const easCommand = 'npx --yes eas-cli@24.7.0';
export const releaseScripts = {
  'release:prepare': 'node scripts/bump-app-version.js',
  'build:release:ios': `${easCommand} build --platform ios --profile production`,
  'build:release:android': `${easCommand} build --platform android --profile production`,
  'build:release:all': `${easCommand} build --platform all --profile production`,
  'build:preview:ios': `${easCommand} build --platform ios --profile preview`,
  'build:preview:android': `${easCommand} build --platform android --profile preview`,
  'submit:production:ios': `${easCommand} submit --platform ios --profile production`,
  'submit:production:android': `${easCommand} submit --platform android --profile production`,
  'update:prepare': 'node scripts/increment-update-version.js src/components/version-debug-row.tsx',
  'update:publish': `${easCommand} update`,
  'legal:deploy:preview': `${easCommand} deploy --export-dir legal-site --alias legal-preview`,
  // A stable alias, not --prod: production belongs to the app's API routes (add-app-api).
  'legal:deploy:production': `${easCommand} deploy --export-dir legal-site --alias legal`,
};

export const defaultEasConfig = {
  cli: { appVersionSource: 'remote' },
  build: {
    preview: { distribution: 'internal', channel: 'preview', environment: 'preview', android: { buildType: 'apk' } },
    production: { distribution: 'store', channel: 'production', environment: 'production', autoIncrement: true },
  },
  submit: { production: { ios: {}, android: { track: 'internal', releaseStatus: 'draft' } } },
};

export const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Report paths, not existing values: custom profiles can contain private configuration.
function addMissing(existing, desired, path, changes, conflicts) {
  const result = structuredClone(existing);
  for (const [key, value] of Object.entries(desired)) {
    const field = `${path}.${key}`;
    if (!Object.hasOwn(existing, key)) {
      result[key] = structuredClone(value);
      changes.push(field);
    } else if (isObject(value) && isObject(existing[key])) {
      result[key] = addMissing(existing[key], value, field, changes, conflicts);
    } else if (JSON.stringify(existing[key]) !== JSON.stringify(value)) {
      conflicts.push(field);
    }
  }
  return result;
}

export function inspectConfiguration(project) {
  const packagePath = resolve(project, 'package.json');
  const easPath = resolve(project, 'eas.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const eas = existsSync(easPath) ? JSON.parse(readFileSync(easPath, 'utf8')) : {};
  if (!isObject(pkg) || !isObject(eas)) throw new Error('Invalid configuration');
  const changes = [];
  const conflicts = [];
  // Profile inheritance/platform overrides can supersede root values. Require review
  // rather than inserting defaults that silently change an inherited profile.
  for (const name of ['preview', 'production']) {
    const profile = eas.build?.[name];
    if (isObject(profile) && Object.hasOwn(profile, 'extends')) conflicts.push(`eas.build.${name}.extends`);
    for (const platform of ['ios', 'android']) {
      if (isObject(profile) && Object.hasOwn(profile, platform) && !isObject(profile[platform])) conflicts.push(`eas.build.${name}.${platform}`);
      for (const key of ['distribution', 'channel', 'environment', 'autoIncrement', 'developmentClient']) {
        if (isObject(profile?.[platform]) && Object.hasOwn(profile[platform], key)) conflicts.push(`eas.build.${name}.${platform}.${key}`);
      }
    }
    if (profile?.developmentClient === true) conflicts.push(`eas.build.${name}.developmentClient`);
    if (profile?.ios?.simulator === true) conflicts.push(`eas.build.${name}.ios.simulator`);
    if (profile?.android?.gradleCommand) conflicts.push(`eas.build.${name}.android.gradleCommand`);
    if (name === 'production' && profile?.android?.buildType && profile.android.buildType !== 'app-bundle') conflicts.push('eas.build.production.android.buildType');
  }
  if (eas.submit?.production?.extends) conflicts.push('eas.submit.production.extends');
  const nextPackage = addMissing(pkg, { scripts: releaseScripts }, 'package', changes, conflicts);
  const nextEas = addMissing(eas, defaultEasConfig, 'eas', changes, conflicts);
  return { changes, conflicts: [...new Set(conflicts)], nextPackage, nextEas };
}

export function configureProject(project, apply = false) {
  try {
    const { changes, conflicts, nextPackage, nextEas } = inspectConfiguration(project);
    if (conflicts.length) return { status: 'needs-action', mode: 'check', changes, conflicts, nextAction: 'Review the named settings and preserve intentional custom configuration before applying defaults.' };
    if (apply && changes.length) {
      // All conflicts are checked before writes. Skip unchanged files for stable reruns.
      if (changes.some(path => path.startsWith('package.'))) writeFileSync(resolve(project, 'package.json'), `${JSON.stringify(nextPackage, null, 2)}\n`);
      if (changes.some(path => path.startsWith('eas.'))) writeFileSync(resolve(project, 'eas.json'), `${JSON.stringify(nextEas, null, 2)}\n`);
    }
    return { status: changes.length && !apply ? 'needs-action' : 'ready', mode: apply ? 'applied' : 'check', changes, conflicts, nextAction: changes.length && !apply ? 'Review changes, then rerun with --apply.' : 'Verify project linkage, environment and selected platform readiness.' };
  } catch {
    return { status: 'failed', changes: [], conflicts: [], nextAction: 'Check readable object-shaped package.json/eas.json and filesystem permissions. Rerun --check to inspect any remaining changes.' };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { project: { type: 'string' }, check: { type: 'boolean' }, apply: { type: 'boolean' } } });
    if (!values.project || Boolean(values.check) === Boolean(values.apply)) throw new Error();
    const result = configureProject(resolve(values.project), values.apply);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = { ready: 0, 'needs-action': 2, failed: 1 }[result.status];
  } catch {
    console.log(JSON.stringify({ status: 'failed', nextAction: 'Use --project <app-directory> and exactly one of --check or --apply.' }));
    process.exitCode = 1;
  }
}
