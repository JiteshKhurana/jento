import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { normalizePgConnectionString } from "@/lib/pg-connection";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getConnectionString() {
  if (process.env.DIRECT_URL?.startsWith("postgresql")) {
    return process.env.DIRECT_URL;
  }
  return process.env.DATABASE_URL;
}

function createPrismaClient() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is not set");
  }

  const pool = new Pool({
    connectionString: normalizePgConnectionString(connectionString),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
