// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const prisma: PrismaClient = new PrismaClient({
  // log: ["query", "info", "warn", "error"],
})

export default prisma
