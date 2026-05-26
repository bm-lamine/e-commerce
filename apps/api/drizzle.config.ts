import { defineConfig } from "drizzle-kit";
import { env } from "src/config/env";

export default defineConfig({
  out: "./drizzle/migrations",
  schema: "./drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: env.PG_URL },
  strict: true,
});
