import { redis } from "src/config/redis";
import type { User } from "./users.schema";

// User cache key utilities
export const USER_TTL = 60 * 60 * 24; // 24 hours
export const USER_EMAIL = (email: string) => `user:email:${email}`;
export const USER_ID = (id: string) => `user:id:${id}`;

// User cache utilities
export function cacheUser(user: User) {
  const json = JSON.stringify(user);
  redis
    .multi()
    .setex(USER_EMAIL(user.email), USER_TTL, json)
    .setex(USER_ID(user.id), USER_TTL, json)
    .exec()
    .catch((err) => console.error("Failed to cache user", user.id, err));
}
