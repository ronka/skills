#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const reviewMarker = 'REVIEW_REQUIRED';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function layout({ appName, title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${escapeHtml(title)} · ${escapeHtml(appName)}</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header><a href="/">${escapeHtml(appName)}</a></header>
  <main>${body}</main>
  <footer><a href="/support/">Support</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></footer>
</body>
</html>
`;
}

function pageBody(title, effectiveDate, sections) {
  return `<h1>${escapeHtml(title)}</h1>
  <p class="meta">Effective ${escapeHtml(effectiveDate)}</p>
  ${sections.map(({ heading, body }) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`).join('\n  ')}`;
}

function siteFiles({ appName, companyName, supportEmail, effectiveDate }) {
  const contact = `<h1>${escapeHtml(appName)} support</h1>
  <p>For help, feedback, account questions, or privacy requests, email <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.</p>
  <nav class="cards"><a href="/support/">Support</a><a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms of Service</a></nav>`;
  const support = `<h1>Support</h1>
  <p>Contact ${escapeHtml(companyName)} about ${escapeHtml(appName)} at <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.</p>
  <p>Include the app version, device model, and a description of the issue. Do not email passwords, payment-card details, or other sensitive information.</p>`;
  const privacy = pageBody('Privacy Policy', effectiveDate, [
    { heading: 'Who operates this app', body: `${companyName} operates ${appName}. Contact ${supportEmail} with privacy questions or requests.` },
    { heading: 'Information and purposes', body: `${reviewMarker}: Describe every category of data the app and its third-party SDKs collect, where it comes from, and every purpose for using it.` },
    { heading: 'Sharing', body: `${reviewMarker}: Name the processors and other recipients that receive data, why they receive it, and whether data is sold or used for tracking.` },
    { heading: 'Retention and deletion', body: `${reviewMarker}: State retention periods or criteria and the exact account/data deletion process.` },
    { heading: 'Your choices', body: `${reviewMarker}: Describe access, correction, export, consent withdrawal, and regional privacy rights that actually apply.` },
    { heading: 'Children', body: `${reviewMarker}: State the app's intended age group and the practices that apply to children, if any.` },
    { heading: 'Changes and contact', body: `Updates will appear on this page with a revised effective date. Contact ${supportEmail}.` },
  ]);
  const terms = pageBody('Terms of Service', effectiveDate, [
    { heading: 'Agreement', body: `These terms govern use of ${appName}, provided by ${companyName}.` },
    { heading: 'Eligibility and accounts', body: `${reviewMarker}: State age, account, and user-responsibility rules that match the product.` },
    { heading: 'Acceptable use and content', body: `${reviewMarker}: Describe prohibited conduct, user-content rights, moderation, and intellectual-property rules that apply.` },
    { heading: 'Purchases and subscriptions', body: `${reviewMarker}: Describe actual prices, renewal, cancellation, refunds, trials, and App Store billing, or state that the app has no purchases.` },
    { heading: 'Service changes and termination', body: `${reviewMarker}: Describe suspension, termination, feature changes, and data consequences.` },
    { heading: 'Disclaimers, liability, and governing law', body: `${reviewMarker}: Supply terms appropriate to the operator and jurisdictions; obtain legal review where needed.` },
    { heading: 'Changes and contact', body: `Updates will appear on this page with a revised effective date. Contact ${supportEmail}.` },
  ]);
  return new Map([
    ['legal-site/index.html', layout({ appName, title: 'Support and legal', body: contact })],
    ['legal-site/support/index.html', layout({ appName, title: 'Support', body: support })],
    ['legal-site/privacy/index.html', layout({ appName, title: 'Privacy Policy', body: privacy })],
    ['legal-site/terms/index.html', layout({ appName, title: 'Terms of Service', body: terms })],
    ['legal-site/styles.css', `:root{font-family:ui-sans-serif,system-ui,sans-serif;color:#172033;background:#f7f8fa}*{box-sizing:border-box}body{margin:0}header,main,footer{width:min(760px,calc(100% - 40px));margin:auto}header{padding:28px 0 12px;font-weight:700}main{padding:32px 0 64px}h1{font-size:clamp(2rem,7vw,3.25rem);line-height:1.05}h2{margin-top:2rem;font-size:1.2rem}p{line-height:1.7}.meta{opacity:.65}.cards{display:grid;gap:12px;margin-top:32px}.cards a{padding:18px;border:1px solid #ccd2dc;border-radius:14px}a{color:#075bc7}footer{display:flex;gap:20px;padding:24px 0 40px;border-top:1px solid #ccd2dc}@media(prefers-color-scheme:dark){:root{color:#edf2fa;background:#10141b}a{color:#78b6ff}.cards a,footer{border-color:#354052}}
`],
  ]);
}

export function inspectLegalPages(project, params = {}) {
  const expectedPaths = [
    'legal-site/index.html',
    'legal-site/support/index.html',
    'legal-site/privacy/index.html',
    'legal-site/terms/index.html',
    'legal-site/styles.css',
  ];
  const missingPaths = expectedPaths.filter(path => !existsSync(resolve(project, path)));
  const missingParams = [];
  if (missingPaths.length && !params.appName) missingParams.push('app-name');
  if (missingPaths.length && !params.supportEmail) missingParams.push('support-email');
  const conflicts = missingParams.length ? [`missing --${missingParams.join(', --')}`] : [];
  const values = {
    appName: params.appName,
    companyName: params.companyName || params.appName,
    supportEmail: params.supportEmail,
    effectiveDate: params.effectiveDate || new Date().toISOString().slice(0, 10),
  };
  const desired = missingPaths.length && !missingParams.length ? siteFiles(values) : new Map();
  const changes = [...missingPaths];
  const files = new Map();
  for (const [relativePath, content] of desired) {
    const target = resolve(project, relativePath);
    if (!existsSync(target)) {
      files.set(relativePath, content);
    }
  }
  return { changes, conflicts, files };
}

export function generateLegalPages(project, params, apply = false) {
  try {
    const { changes, conflicts, files } = inspectLegalPages(project, params);
    if (conflicts.length) return { status: 'needs-action', mode: 'check', changes, conflicts, nextAction: 'Supply --app-name and --support-email, then rerun.' };
    if (apply) {
      for (const [relativePath, content] of files) {
        const target = resolve(project, relativePath);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, content);
      }
    }
    const unresolved = ['legal-site/privacy/index.html', 'legal-site/terms/index.html']
      .filter(path => existsSync(resolve(project, path)) && readFileSync(resolve(project, path), 'utf8').includes(reviewMarker));
    if (!changes.length && !unresolved.length) return { status: 'ready', mode: apply ? 'applied' : 'check', changes, conflicts, nextAction: 'Preview the pages locally, then deploy and verify every public URL.' };
    if (!apply) return { status: 'needs-action', mode: 'check', changes, conflicts, nextAction: changes.length ? 'Review the planned files, then rerun with --apply.' : 'Replace every REVIEW_REQUIRED section with accurate, app-specific text.' };
    return { status: 'needs-action', mode: 'applied', changes, conflicts, nextAction: 'Replace every REVIEW_REQUIRED section with accurate, app-specific text before deployment.' };
  } catch {
    return { status: 'failed', changes: [], conflicts: [], nextAction: 'Check legal-site filesystem permissions and rerun --check.' };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: {
      project: { type: 'string' }, check: { type: 'boolean' }, apply: { type: 'boolean' },
      'app-name': { type: 'string' }, 'company-name': { type: 'string' },
      'support-email': { type: 'string' }, 'effective-date': { type: 'string' },
    } });
    if (!values.project || Boolean(values.check) === Boolean(values.apply)) throw new Error();
    const params = { appName: values['app-name'], companyName: values['company-name'], supportEmail: values['support-email'], effectiveDate: values['effective-date'] };
    const result = generateLegalPages(resolve(values.project), params, values.apply);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = { ready: 0, 'needs-action': 2, failed: 1 }[result.status];
  } catch {
    console.log(JSON.stringify({ status: 'failed', nextAction: 'Use --project <app-directory>, exactly one of --check or --apply, and --app-name/--support-email.' }));
    process.exitCode = 1;
  }
}
