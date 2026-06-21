import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { schema } from "src/config/db";
import z from "zod";

export const select_user_schema = createSelectSchema(schema.users, {
  id: z.nanoid(),
  email: z.email(),
});

export const create_user_schema = createInsertSchema(schema.users, {
  email: z.email().trim(),
});

export const public_user_schema = select_user_schema.pick({
  id: true,
  email: true,
});

export type User = z.infer<typeof select_user_schema>;
export type CreateUserJson = z.infer<typeof create_user_schema>;
export type PublicUser = z.infer<typeof public_user_schema>;
