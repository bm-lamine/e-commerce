import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { schema } from "src/config/db";
import z from "zod";

export const selectUserSchema = createSelectSchema(schema.users, {
  id: z.nanoid(),
  email: z.email(),
});

export const createUserSchema = createInsertSchema(schema.users, {
  email: z.email().trim(),
});

export type User = z.infer<typeof selectUserSchema>;
export type CreateUserJson = z.infer<typeof createUserSchema>;
