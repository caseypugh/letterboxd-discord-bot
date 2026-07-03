/**
 * One-off copy of production data from the old Postgres database (Neon) into
 * Turso. Run AFTER the schema migration has been applied to Turso
 * (`pnpm db:deploy`), while the bot is stopped:
 *
 *   POSTGRES_URL='postgresql://...neon.tech/...?sslmode=require' \
 *   TURSO_DATABASE_URL='libsql://...' TURSO_AUTH_TOKEN='...' \
 *   NODE_PATH=./ pnpm exec ts-node src/tools/migrate-data.ts
 *
 * Idempotent-ish: refuses to run if the target already has rows.
 */
import { Client as PgClient } from "pg"
import { createClient } from "@libsql/client"
import "dotenv/config"

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

async function main() {
  const postgresUrl = process.env.POSTGRES_URL
  const tursoUrl = process.env.TURSO_DATABASE_URL
  if (!postgresUrl || !tursoUrl) {
    throw new Error("Set POSTGRES_URL (source) and TURSO_DATABASE_URL (target)")
  }

  const pg = new PgClient({ connectionString: postgresUrl })
  await pg.connect()
  const turso = createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN })

  const existing = await turso.execute(`SELECT COUNT(*) AS n FROM "GuildConfig"`)
  if (Number(existing.rows[0].n) > 0) {
    throw new Error("Target Turso database already has GuildConfig rows — refusing to copy")
  }

  const guilds = await pg.query(`SELECT * FROM "GuildConfig" ORDER BY "id"`)
  for (const g of guilds.rows) {
    await turso.execute({
      sql: `INSERT INTO "GuildConfig" ("id", "guildId", "createdAt", "updatedAt", "channelId") VALUES (?, ?, ?, ?, ?)`,
      args: [g.id, g.guildId, iso(g.createdAt), iso(g.updatedAt), g.channelId],
    })
  }
  console.log(`Copied ${guilds.rows.length} GuildConfig rows`)

  const users = await pg.query(`SELECT * FROM "User" ORDER BY "id"`)
  for (const u of users.rows) {
    await turso.execute({
      sql: `INSERT INTO "User" ("id", "username", "guildId", "createdAt", "updatedAt", "lastCheckedAt", "snoozedUntil") VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [u.id, u.username, u.guildId, iso(u.createdAt), iso(u.updatedAt), iso(u.lastCheckedAt), iso(u.snoozedUntil)],
    })
  }
  console.log(`Copied ${users.rows.length} User rows`)

  await pg.end()
  turso.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
