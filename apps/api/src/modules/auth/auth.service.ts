import { redis } from "src/config/redis";
import { ACCESS_TTL, REFRESH_TTL, USER_SID } from "./auth.cache";
import { hashJwt, signJwt } from "./jwt/jwt.service";

export async function authenticate(userId: string) {
  const [accessToken, refreshToken] = await Promise.allSettled([
    signJwt({ sub: userId }, ACCESS_TTL),
    signJwt({ sub: userId }, REFRESH_TTL),
  ]);

  if (
    accessToken.status !== "fulfilled" ||
    refreshToken.status !== "fulfilled"
  ) {
    throw new Error("Failed to generate tokens");
  }

  await redis
    .multi()
    .sadd(USER_SID(userId), hashJwt(refreshToken.value))
    .expire(USER_SID(userId), REFRESH_TTL, "NX")
    .exec();

  return {
    accessToken: accessToken.value,
    refreshToken: refreshToken.value,
  };
}

export async function hashPassword(plain: string) {
  return await Bun.password.hash(plain, "argon2id");
}

export async function comparePassword(plain: string, hash: string) {
  return await Bun.password.verify(plain, hash, "argon2id");
}
