import { pgSchema } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const auth = pgSchema("auth");

export const users = auth.table("users", (c) => ({
  id: c.text().primaryKey().$defaultFn(nanoid),
  email: c.text().notNull().unique(),
  password: c.text().notNull(),
}));
