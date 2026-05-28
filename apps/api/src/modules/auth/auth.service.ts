import { redis } from "src/config/redis";
import { ACCESS_TTL, REFRESH_TTL, USER_SID } from "./auth.cache";
import { hashJwt, signJwt } from "./jwt/jwt.service";

export async function generateTokens(userId: string) {
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

  return {
    accessToken: accessToken.value,
    refreshToken: refreshToken.value,
  };
}

export async function authenticate(userId: string) {
  const { accessToken, refreshToken } = await generateTokens(userId);

  await redis
    .multi()
    .sadd(USER_SID(userId), hashJwt(refreshToken))
    .expire(USER_SID(userId), REFRESH_TTL, "NX")
    .exec();

  return { accessToken, refreshToken };
}

export async function refreshTokens({
  key,
  token,
  userId,
}: RefreshTokensParams) {
  const { accessToken, refreshToken } = await generateTokens(userId);

  await redis
    .multi()
    .srem(key, hashJwt(token))
    .sadd(key, hashJwt(refreshToken))
    .expire(key, REFRESH_TTL, "NX")
    .exec();

  return { accessToken, refreshToken };
}

export async function hashPassword(plain: string) {
  return await Bun.password.hash(plain, "argon2id");
}

export async function comparePassword(plain: string, hash: string) {
  return await Bun.password.verify(plain, hash, "argon2id");
}

export type RefreshTokensParams = {
  key: string;
  token: string;
  userId: string;
};
