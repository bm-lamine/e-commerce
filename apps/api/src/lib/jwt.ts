import crypto from "crypto";
import { sign, verify } from "hono/jwt";
import { env } from "src/config/env";
import z from "zod";

export const payload_schema = z.object({
  sub: z.nanoid().trim(),
});

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
    return payload_schema.parse(payload);
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

export type JwtPayload = z.infer<typeof payload_schema>;
