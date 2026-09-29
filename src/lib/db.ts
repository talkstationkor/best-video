import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// The database is the shared tmt MariaDB (see prisma/schema.prisma). The
// server hands new connections a binary result charset, so every connection
// runs SET NAMES first (the same thing Laravel does on the tmt side);
// otherwise every string column comes back as raw bytes.
function createClient() {
  const url = new URL(process.env.DATABASE_URL ?? "");

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    initSql: "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    // Serverless functions each hold their own pool; keep it small so the
    // shared host's connection limit isn't exhausted.
    connectionLimit: 5
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });
}

// Standard Next.js singleton pattern so dev hot-reload doesn't open a new
// connection pool on every file change.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
