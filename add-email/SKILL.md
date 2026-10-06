---
name: add-email
description: Add transactional email through Resend, with a server-only `sendEmail()` and a branded base template that is safe for Hebrew and RTL, on the web (Next.js) or in the mobile app (Expo, sent only from its API routes). Use when the product needs to send email (confirmations, receipts, notifications, invitations), when setting up Resend or a sending domain, or when setup recorded Resend as the email provider.
---

# Add email

Wire Resend with tested reference code from `assets/`. Copy the files, then adapt only what the steps say. Match the user's conversation language and keep keys out of chat, logs, and Git.

Sign-in links are not part of this skill. The sign-in skills reuse what it sets up.

Pick the platform from `package.json`: `next` means **Web**, `expo` means **Mobile**. Where a step differs, follow only that platform's part.

**Mobile prerequisite:** the app sends email only from its own API routes, so the key never ships in the app. When `app.json` has no `"web": { "output": "server" }`, run the `add-app-api` skill first (`.claude/skills/add-app-api/SKILL.md` in Claude Code, `.agents/skills/add-app-api/SKILL.md` in Codex), then continue here.

## 1. Inspect

Read `package.json`, `PRODUCT.md`, `DESIGN.md`, `.env.local`, `.env.example`, and `.gitignore` when present. Classify each item as present or missing:

- `sendEmail()` and `renderEmail()`: web `lib/email.ts` and `lib/email-template.ts`; mobile `src/server/email.ts` and `src/server/email-template.ts`
- other Resend send calls anywhere in the code
- `resend` in `dependencies`
- `RESEND_API_KEY` and `EMAIL_FROM` in `.env.local` (check names only; never print values)

When everything is present, skip to step 4 and verify. Change only what fails. If other code already sends through Resend, keep it working and point new sends at `sendEmail()`.

## 2. Copy the code

1. Copy the code:
   - Web: `assets/web/lib/email.ts` to `lib/email.ts`, and `assets/common/email-template.ts` to `lib/email-template.ts`.
   - Mobile: `assets/mobile/src/server/email.ts` to `src/server/email.ts`, and `assets/common/email-template.ts` to `src/server/email-template.ts`.
2. Run `npm install resend`.
3. Fill `emailBrand` in the copied `email-template.ts`: the product name, `lang` from the primary locale in `PRODUCT.md`, `dir` from its layout direction (`auto` takes the primary locale's direction), and colors from `DESIGN.md`. Keep `buttonText` at WCAG AA contrast against `button`.
4. Add `RESEND_API_KEY=` and `EMAIL_FROM=` to `.env.example`, creating it if needed. When `.gitignore` ignores `.env*`, add `!.env.example` on the line after it.

## 3. Provision Resend

Follow [references/resend-setup.md](references/resend-setup.md): a sending domain with click and open tracking off, a `sending_access` key written straight to `.env.local`, and `EMAIL_FROM` set to `"<Product name> <hello@<sending domain>>"`.

When the Resend MCP tools are not available yet, for example right after setup added them to the MCP config, don't wait for them. Ask the user to create a sending-access key at resend.com/api-keys and paste it, or record the blocker and next action in `SETUP.md` `Resume notes` (or tell the user outside setup) and stop here. Without a verified domain, Resend sends only to the account owner's address from `onboarding@resend.dev`; say so if you use it for a first test.

## 4. Use it

Call `sendEmail()` only from server code. Web: server actions, route handlers, and server components, never a `"use client"` file, importing from `@/lib/email`. Mobile: `src/app/**/*+api.ts` routes only, importing from `@/server/email`; screens call the route through its typed client.

```ts
import { sendEmail } from "@/lib/email"; // Mobile: '@/server/email'

await sendEmail({
  to: order.email,
  subject: "ההזמנה התקבלה",
  idempotencyKey: `order-confirmation/${order.id}`,
  content: {
    preview: "פרטי ההזמנה שלכם",
    heading: "תודה, ההזמנה התקבלה",
    paragraphs: ["נעדכן אתכם כשההזמנה תצא לדרך."],
    action: { label: "לצפייה בהזמנה", url: `${origin}/orders/${order.id}` },
    footer: "קיבלתם את המייל הזה כי ביצעתם הזמנה באתר.",
  },
});
```

- Write copy in the primary product locale. Address Hebrew readers in the plural imperative (לחצו, צפו).
- Pass user input through `content`; `renderEmail()` escapes it. Pass raw `html` only for markup you wrote, and escape every value in it with `escapeHtml()`.
- Pass an `idempotencyKey` derived from the event (an order, a booking) whenever a send can be retried.
- Save the data first, then send. A failed email must not undo or block the user's action: catch, log, and let the user retry.
- Use absolute URLs in emails, built from the deployed origin. On mobile, links that should open the app use its URI scheme or a page on the deployed API's domain.
- On mobile, a route that sends email spends money and can be abused. Follow `add-app-api` step 6 before shipping it.

## 5. Verify

1. Web: `npm run lint` and `npm run build` pass. Mobile: `npm run lint` and `npx tsc --noEmit` pass.
2. Send one test through `sendEmail()` to an inbox the user named, from the feature's own server action or route, or from a temporary route called once on the dev server (web `app/api/test-email/route.ts`, mobile `src/app/test-email+api.ts` at `http://localhost:8081/test-email`). Never email an address the user did not provide. Delete the temporary route afterwards.
3. Confirm the email arrived, reads right-to-left for an RTL product, and the button works. If the domain is still waiting for DNS, record the test as blocked on DNS instead.

## Production

Use a separate key per environment, as the reference describes.

- Web: `web-publish` transfers `RESEND_API_KEY` and `EMAIL_FROM` to Vercel.
- Mobile: set both in the EAS `production` environment with `sensitive` visibility, as `add-app-api` step 4 describes, then run `npm run deploy:api`.

## Handoff

Tell the user, in one or two sentences, that email is connected, which sender it uses, and any remaining action, such as adding DNS records.
