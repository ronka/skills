#!/usr/bin/env node

// Applies db/migrations/NNN_name.sql files in filename order, once each.
// Each file runs in its own transaction and is recorded in schema_migrations,
// so a second run applies nothing. Usage: npm run db:migrate

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = fileURLToPath(new URL("..", import.meta.url));
const migrationsDirectory = fileURLToPath(new URL("../db/migrations/", import.meta.url));
const migrationName = /^\d{3,}_[a-z0-9_-]+\.sql$/;
// Any fixed number works. A transaction-scoped lock keeps two runs from applying the same
// file and also works through Neon's pooled (PgBouncer transaction mode) connection string.
const lockKey = 7_201_002;

for (const file of [".env.local", ".env"]) {
  const path = `${root}${file}`;
  // Values already set in the shell win over the file.
  if (existsSync(path)) process.loadEnvFile(path);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to .env.local or the shell environment.");
  process.exit(1);
}

const files = existsSync(migrationsDirectory)
  ? readdirSync(migrationsDirectory).filter((name) => name.endsWith(".sql")).sort()
  : [];
const misnamed = files.filter((name) => !migrationName.test(name));
if (misnamed.length) {
  console.error(`Rename these migrations to NNN_name.sql (lowercase): ${misnamed.join(", ")}`);
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

try {
  await client.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const { rows } = await client.query("select name from schema_migrations");
  const applied = new Set(rows.map((row) => row.name));
  const pending = files.filter((name) => !applied.has(name));

  if (!pending.length) {
    console.log(`No pending migrations (${applied.size} applied).`);
  }

  for (const name of pending) {
    const sql = readFileSync(`${migrationsDirectory}${name}`, "utf8");
    try {
      await client.query("begin");
      await client.query("select pg_advisory_xact_lock($1)", [lockKey]);
      const done = await client.query("select 1 from schema_migrations where name = $1", [name]);
      if (done.rowCount) {
        // Another run applied it while this one waited for the lock.
        await client.query("rollback");
        continue;
      }
      await client.query(sql);
      await client.query("insert into schema_migrations (name) values ($1)", [name]);
      await client.query("commit");
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query("rollback");
      console.error(`Failed ${name}; nothing from this file was applied.`);
      throw error;
    }
  }
} finally {
  await client.end();
}
