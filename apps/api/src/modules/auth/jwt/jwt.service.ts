import crypto from "crypto";
import { sign, verify } from "hono/jwt";
import { env } from "src/config/env";
import { payloadSchema, type JwtPayload } from "./jwt.schema";

export async function signJwt(payload: JwtPayload, ttl: number) {
  const now = Math.floor(Date.now() / 1000);
  return await sign(
    { ...payload, iat: now, exp: now + ttl },
    env.JWT_SECRET,
    "HS256",
  );
}

export async function verifyJwt(token: string) {
  try {
    const payload = await verify(token, env.JWT_SECRET, "HS256");
    return payloadSchema.parse(payload);
  } catch {
    return null;
  }
}

export function hashJwt(token: string): string {
  return crypto
    .createHmac("sha256", env.HASH_SECRET)
    .update(token)
    .digest("hex");
}
