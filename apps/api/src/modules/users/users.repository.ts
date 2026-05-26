import { eq, type InferInsertModel } from "drizzle-orm";
import { db, schema } from "src/config/db";

// User database query utilities
export async function queryUserByEmail({ email }: { email: string }) {
  const results = await db
    .select()
    .from(schema.users)
    .where((c) => eq(c.email, email))
    .limit(1);

  if (results.length < 1 || !results[0]) return null;
  return results[0];
}

export async function insertUser(data: InsertUserParams) {
  const [result] = await db.insert(schema.users).values(data).returning();
  if (!result) throw new Error("Failed to insert user");
  return result;
}

type InsertUserParams = InferInsertModel<typeof schema.users>;
