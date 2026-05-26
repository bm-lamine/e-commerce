import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { db } from "src/config/db";
import { redis } from "src/config/redis";

const app = new Hono();

app.use(logger());

app.get("/health", async (c) => {
  return c.json({
    database: await db.execute(sql`SELECT NOW()`),
    cache: await redis.get(""),
  });
});

export default app;
