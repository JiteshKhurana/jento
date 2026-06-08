import "dotenv/config";
import { defineConfig } from "prisma/config";
import { normalizePgConnectionString } from "./lib/pg-connection";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: normalizePgConnectionString(
      process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
    ),
  },
});
