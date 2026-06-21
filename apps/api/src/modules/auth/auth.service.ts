import { redis } from "src/config/redis";
import { hashJwt, signJwt } from "src/lib/jwt";
import { ACCESS_TTL, REFRESH_TTL, USER_SID } from "./auth.cache";

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

export type RefreshTokensParams = {
  key: string;
  token: string;
  userId: string;
};
