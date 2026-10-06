---
name: add-database
description: Add a Neon Postgres database with plain SQL migrations in `db/migrations` and `npm run db:migrate`, on the web (Next.js, `pg` pool) or in the mobile app (Expo, reached only from its API routes). Use when the product needs to save data on a server, needs tables or migrations, or when setup recorded Neon as the database.
---

# Add the database

Wire Neon Postgres with tested reference code from `assets/`. Plain SQL, no ORM. Copy the files, then adapt only what the steps say. Match the user's conversation language and keep secrets out of chat, logs, and Git.

Pick the platform from `package.json`: `next` means **Web**, `expo` means **Mobile**. Where a step differs, follow only that platform's part.

**Mobile prerequisite:** the app reaches the database only from its own API routes, never from screens. When `app.json` has no `"web": { "output": "server" }`, run the `add-app-api` skill first (`.claude/skills/add-app-api/SKILL.md` in Claude Code, `.agents/skills/add-app-api/SKILL.md` in Codex), then continue here.

## 1. Inspect

Read `package.json`, `PRODUCT.md`, `SETUP.md`, `.env.local`, `.env.example`, and `.gitignore` when present. Classify each item as present or missing:

- the database module: web `lib/database.ts` exporting `database()`; mobile `src/server/database.ts` exporting `sql()` and `withPool()`
- `scripts/migrate.mjs`, the `db:migrate` script, and `db/migrations/`
- packages: web `pg` in `dependencies`; mobile `@neondatabase/serverless` in `dependencies` and `pg` in `devDependencies`; both `@types/pg` in `devDependencies`
- `DATABASE_URL` in `.env.local` (check the name only; never print the value)

When everything is present, skip to step 5 and verify. Change only what fails.

## 2. Copy the code

1. Copy `assets/common/scripts/migrate.mjs` to `scripts/migrate.mjs` and create `db/migrations/`. The runner uses `pg` and runs only in local Node, on both platforms.
2. Copy the database module and install packages:
   - Web: copy `assets/web/lib/database.ts` to `lib/database.ts`. Run `npm install pg` and `npm install -D @types/pg`.
   - Mobile: copy `assets/mobile/src/server/database.ts` to `src/server/database.ts`. Run `npm install @neondatabase/serverless` and `npm install -D pg @types/pg`. Routes run on Cloudflare Workers, where `pg` can't open TCP connections, so the app uses Neon's serverless driver and `pg` stays a development tool.
3. Add `"db:migrate": "node scripts/migrate.mjs"` to `package.json` scripts.
4. Add `DATABASE_URL=` to `.env.example`, creating it if needed. Make sure `.gitignore` keeps `.env.example` tracked: when it ignores `.env*`, add `!.env.example` on the line after it.

## 3. Provision the database

Try these in order and stop at the first that works:

1. **Neon MCP.** If Neon MCP tools are available in this session, find or create a project named after the product, then get its pooled connection string.
2. **Neon CLI, signed in.** Only when `~/.config/neon/credentials.json` exists or `NEON_API_KEY` is set, because any other `neon` command opens a browser sign-in. Create the project with `npx --yes neon@7 projects create --name <product>` and read the string with `npx --yes neon@7 connection-string --pooled --project-id <id>`.
3. **Claimable database, no account.** Run `npx --yes neon@7 claim create --file .env.local`. It writes the pooled `DATABASE_URL`, plus `DATABASE_URL_UNPOOLED` and `NEON_BRANCH`, to `.env.local`, and a `.neon` file that links the folder to the project; add `.neon` to `.gitignore`. The project is deleted after 72 hours unless claimed: run `npx --yes neon@7 claim accept --no-open`, give the user the URL it prints and the `Project Expires At` time from `claim create`, and repeat both in the handoff.
4. **Ask.** Ask the user to paste a Neon connection string from the Neon console (Connect → pooled connection). Explain where to find it in one sentence.

Write `DATABASE_URL` to `.env.local` without echoing the value. Use the pooled string (its host contains `-pooler`). Change `sslmode=require` in it to `sslmode=verify-full`: `pg` already treats them the same, and the explicit mode stops a security warning on every connection. Check flags with `--help` if a command rejects them; the CLI changes over time.

If none of these works, for example the MCP needs approval and the user is away, leave the copied code in place, record the blocker and next action in `SETUP.md` `Resume notes` (or tell the user outside setup), and stop here.

## 4. Write migrations

Every schema change is a new file `db/migrations/NNN_short_name.sql`: three or more digits, lowercase, underscores. Number it one above the highest existing file.

- Never edit or rename a migration that has been applied anywhere. Fix mistakes with a new migration.
- Each file runs in one transaction. Statements that can't run in a transaction, such as `create index concurrently`, need their own manual step.
- Use `bigint generated always as identity` or `uuid` primary keys, `timestamptz` for times, `text` instead of `varchar(n)`, and explicit `not null`.
- Create only the tables the requested feature needs. When this skill runs from setup with no feature yet, add no migration.

Then run `npm run db:migrate`.

## 5. Use it

**Web:** import `database` from `@/lib/database` only in server code: server components, server actions, and route handlers. Never import it in a file with `"use client"`.

```ts
import { database } from "@/lib/database";

const { rows } = await database().query<{ id: string; body: string }>(
  "select id, body from notes where owner_id = $1 order by created_at desc",
  [ownerId],
);
```

**Mobile:** import from `@/server/database` only in `src/app/**/*+api.ts` routes; the ESLint rule from `add-app-api` blocks it elsewhere. Screens call the route through its typed client.

```ts
import { sql, withPool } from '@/server/database';

// One query: HTTP, one Workers subrequest.
const notes = await sql()`select id, body from notes where owner_id = ${ownerId} order by created_at desc`;

// Several queries or a transaction: one pool for this request, closed afterwards.
await withPool(async (pool) => {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('insert into notes (owner_id, body) values ($1, $2)', [ownerId, body]);
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
});
```

`sql()` is a tagged template: interpolated values are sent as parameters, never spliced into the SQL. Each `sql()` call is one subrequest, and the EAS Free plan allows 10 per request, so a route that runs several queries uses `withPool`.

Both platforms:

- Always pass values as `$1, $2, …` parameters (or `sql()` template values). Never build SQL with template strings or concatenation from input.
- Validate input at the server boundary before it reaches a query.
- Web: for several writes that must succeed together, take a client with `database().connect()`, run `begin`/`commit`/`rollback`, and `release()` it in `finally`.

## 6. Verify

1. `npm run db:migrate` applies pending files; a second run prints `No pending migrations`.
2. Web: `npm run lint` and `npm run build` pass. Mobile: `npm run lint` and `npx tsc --noEmit` pass.
3. When a feature uses the database, exercise it once (web in the browser, mobile from the app in Expo Go or a simulator) and confirm the row exists. On mobile, also call the route once on the deployed API after the next `npm run deploy:api`.

## Production

The same `DATABASE_URL` serves development and production until the user creates a separate Neon branch for development. Before deploying code that needs a new table, run `npm run db:migrate` against the production database.

- Web: `web-publish` transfers `DATABASE_URL` to Vercel.
- Mobile: set `DATABASE_URL` in the EAS `production` environment with `sensitive` visibility, as `add-app-api` step 4 describes, then run `npm run deploy:api`. Never give it the `EXPO_PUBLIC_` prefix.

## Handoff

Tell the user, in one or two sentences, that the database is connected, which tables exist, and any remaining action: claiming a temporary database, or a blocked provisioning step.
