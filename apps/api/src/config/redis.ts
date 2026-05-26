import Redis from "ioredis";
import { env } from "src/config/env";

export const redis = new Redis(env.REDIS_URL)
  .on("error", (err) => console.error("Redis error:", err))
  .on("connect", () => console.log("Connected to Redis"));
