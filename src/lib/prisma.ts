// lib/prisma.ts
import "dotenv/config"
import path from "path"
import { PrismaClient } from "@prisma/client"
import { PrismaLibSQL } from "@prisma/adapter-libsql"

// The bot talks to SQLite through the libSQL driver adapter. In production
// point TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) at a Turso database; locally
// leave them unset and DATABASE_URL's file: path is used instead.

// Prisma CLI resolves relative file: URLs against prisma/schema.prisma, but
// the libSQL driver resolves them against process.cwd(). Anchor to the prisma
// directory so `prisma migrate dev` and the running bot open the same file.
function resolveFileUrl(url: string): string {
  if (!url.startsWith("file:")) return url
  const filePath = url.slice("file:".length)
  if (path.isAbsolute(filePath)) return url
  return "file:" + path.resolve(__dirname, "../../prisma", filePath)
}

const adapter = new PrismaLibSQL({
  url: process.env.TURSO_DATABASE_URL || resolveFileUrl(process.env.DATABASE_URL || "file:./dev.db"),
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const prisma: PrismaClient = new PrismaClient({
  adapter,
  // log: ["query", "info", "warn", "error"],
})

export default prisma
