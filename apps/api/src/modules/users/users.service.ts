import { retrieveCache } from "src/utils/retrieve-cache";
import { cacheUser, USER_EMAIL } from "./users.cache";
import { insertUser, queryUserByEmail } from "./users.repository";
import {
  public_user_schema,
  select_user_schema,
  type CreateUserJson,
  type User,
} from "./users.schema";

export async function findUserByEmail(email: string) {
  const cached = await retrieveCache({
    key: USER_EMAIL(email),
    schema: select_user_schema,
    del: false,
  });
  if (cached) return cached;

  const stored = await queryUserByEmail({ email });
  if (!stored) return null;

  cacheUser(stored);
  return stored;
}

export async function createUser(data: CreateUserJson) {
  const user = await insertUser(data);
  cacheUser(user);
  return user;
}

export function getPublicUserFields(user: User) {
  return public_user_schema.parse(user);
}
