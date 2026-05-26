import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "drizzle/schema";
import postgres from "postgres";
import { env } from "src/config/env";

const globalForDb = globalThis as typeof globalThis & {
  conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(env.PG_URL);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

const db = drizzle(conn, {
  schema,
  logger: true,
});

export { db, schema };
