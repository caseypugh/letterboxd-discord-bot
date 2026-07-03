/**
 * Applies pending Prisma migrations over libSQL. `prisma migrate deploy`
 * can't connect to Turso's libsql:// protocol, so this reads
 * prisma/migrations/<name>/migration.sql in order and executes any that
 * haven't been applied yet, tracking them in a `_migrations` table.
 *
 * Targets TURSO_DATABASE_URL if set, otherwise the local DATABASE_URL file.
 * Migrations already recorded by `prisma migrate dev` (in _prisma_migrations)
 * are treated as applied so local databases don't get double-migrated.
 */
import fs from "fs"
import path from "path"
import { createClient } from "@libsql/client"
import "dotenv/config"

const migrationsDir = path.resolve(__dirname, "../../prisma/migrations")

function localFileUrl(url: string): string {
  if (!url.startsWith("file:")) return url
  const filePath = url.slice("file:".length)
  if (path.isAbsolute(filePath)) return url
  // Prisma CLI resolves relative file: URLs against the prisma directory.
  return "file:" + path.resolve(__dirname, "../../prisma", filePath)
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL || localFileUrl(process.env.DATABASE_URL || "file:./dev.db")
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })

  await client.execute(
    `CREATE TABLE IF NOT EXISTS "_migrations" ("name" TEXT PRIMARY KEY, "appliedAt" TEXT NOT NULL)`
  )

  const applied = new Set<string>()
  const rows = await client.execute(`SELECT "name" FROM "_migrations"`)
  for (const row of rows.rows) applied.add(String(row.name))

  const hasPrismaTable = await client.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_prisma_migrations'`
  )
  if (hasPrismaTable.rows.length > 0) {
    const prismaRows = await client.execute(
      `SELECT "migration_name" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL`
    )
    for (const row of prismaRows.rows) applied.add(String(row.migration_name))
  }

  const migrations = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  let count = 0
  for (const name of migrations) {
    if (applied.has(name)) continue
    const sql = fs.readFileSync(path.join(migrationsDir, name, "migration.sql"), "utf8")
    console.log(`Applying migration ${name}...`)
    await client.executeMultiple(sql)
    await client.execute({
      sql: `INSERT INTO "_migrations" ("name", "appliedAt") VALUES (?, ?)`,
      args: [name, new Date().toISOString()],
    })
    count++
  }

  console.log(count > 0 ? `Applied ${count} migration(s)` : "No pending migrations")
  client.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
