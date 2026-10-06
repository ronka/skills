#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs, parseEnv } from 'node:util';

// Values stay in memory/stdin. Neither the report nor raw provider output contains them.
export function transferEnvironment(options, run = spawnSync) {
  const completed = [];
  const fail = (summary, nextAction) => ({ status: 'failed', completed, summary, nextAction });
  try {
    const names = options.names?.split(',');
    const publicNames = options['public-names'] ? options['public-names'].split(',') : [];
    if (!options.project || !options.file || !['preview', 'production'].includes(options.environment) ||
        !options['project-id'] || !options['org-id'] || !names?.length ||
        names.some(name => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) || new Set(names).size !== names.length ||
        publicNames.some(name => !names.includes(name) || !name.startsWith('NEXT_PUBLIC_')) ||
        names.some(name => name.startsWith('NEXT_PUBLIC_') && !publicNames.includes(name))) {
      return fail('Missing or invalid target, names, or public-variable classification.', 'Select project, file, environment, expected IDs, and explicit names; classify NEXT_PUBLIC_ names with --public-names.');
    }
    const project = resolve(options.project);
    const link = JSON.parse(readFileSync(resolve(project, '.vercel/project.json'), 'utf8'));
    if (link.projectId !== options['project-id'] || link.orgId !== options['org-id']) {
      return fail('Linked project does not match the expected target.', 'Resolve the project/account mismatch before transferring values.');
    }
    const vars = parseEnv(readFileSync(resolve(project, options.file), 'utf8'));
    const missing = names.filter(name => !Object.hasOwn(vars, name) || vars[name].length === 0);
    if (missing.length) return fail(`Missing or empty selected variables: ${missing.join(', ')}.`, 'Provide final values for all selected names before uploading.');
    if (!options['literal-dollar'] && names.some(name => /\$[{A-Za-z_]/.test(vars[name]) || vars[name].includes('\\$'))) {
      return fail('A selected value may contain dotenv interpolation or dollar escaping.', 'Prepare final literal values; use --literal-dollar only when dollar characters are intentional.');
    }
    const target = { projectId: link.projectId, orgId: link.orgId, environment: options.environment };
    if (!options.apply) return { status: 'ready', mode: 'check', target, names, publicNames, replace: Boolean(options.replace), completed };
    for (const name of names) {
      const args = ['env', 'add', name, options.environment, '--project', link.projectId, '--scope', link.orgId, '--yes', '--non-interactive'];
      args.push(publicNames.includes(name) ? '--no-sensitive' : '--sensitive');
      if (options.replace) args.push('--force');
      const result = run(options.cli ? process.execPath : 'vercel', options.cli ? [resolve(options.cli), ...args] : args, {
        cwd: project, input: vars[name], encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 45000, windowsHide: true,
      });
      if (result.error || result.status !== 0) {
        return { ...fail(`Transfer was not confirmed for ${name}.`, 'Check authentication and the target variable in Vercel; a timeout may have succeeded. Retry only unresolved names, using --replace if replacing is intended.'), target, pending: names.filter(key => !completed.includes(key)) };
      }
      completed.push(name);
    }
    return { status: 'ready', mode: 'applied', target, completed, nextAction: 'Verify target names, deploy again, and test the app.' };
  } catch {
    return fail('Could not read configuration or complete the transfer.', 'Check the project link, literal dotenv file and CLI availability. No raw provider output is included.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const stringOptions = ['project', 'file', 'names', 'public-names', 'environment', 'project-id', 'org-id', 'cli'];
    const { values } = parseArgs({ options: {
      ...Object.fromEntries(stringOptions.map(name => [name, { type: 'string' }])),
      apply: { type: 'boolean' }, replace: { type: 'boolean' }, 'literal-dollar': { type: 'boolean' },
    } });
    const result = transferEnvironment(values);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 'ready' ? 0 : 1;
  } catch {
    console.log(JSON.stringify({ status: 'failed', summary: 'Invalid arguments. Read references/provider.md for the transfer command.' }));
    process.exitCode = 1;
  }
}
