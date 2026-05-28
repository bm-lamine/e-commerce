import postgres from "postgres";
import { redis } from "src/config/redis";
import type { User } from "src/modules/users/users.schema";
import { createUser, findUserByEmail } from "src/modules/users/users.service";
import { tryCatch } from "src/utils/try-catch";
import { USER_SID } from "./auth.cache";
import type { LoginJson, RefreshTokenJson, RegisterJson } from "./auth.schema";
import {
  authenticate,
  comparePassword,
  hashPassword,
  refreshTokens,
} from "./auth.service";
import { hashJwt, verifyJwt } from "./jwt/jwt.service";

export async function registerFn(
  data: RegisterJson,
): Promise<RegisterResponse> {
  const { data: user, error } = await tryCatch(
    createUser({
      ...data,
      password: await hashPassword(data.password),
    }),
  );

  if (error) {
    const pgError = error.cause;
    const isPgError = pgError instanceof postgres.PostgresError;
    if (isPgError && pgError.code === "23505") {
      return {
        code: "EMAIL_ALREADY_IN_USE",
        path: ["email"],
        message: "email already in use",
      };
    }

    return {
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    };
  }

  return {
    code: "SUCCESS",
    message: "user registered successfully",
    user,
  };
}

export async function loginFn(data: LoginJson): Promise<LoginResponse> {
  const { data: user, error } = await tryCatch(findUserByEmail(data.email));

  if (error) {
    return {
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    };
  }

  if (!user || !(await comparePassword(data.password, user.password))) {
    return {
      code: "INVALID_CREDENTIALS",
      path: ["email"],
      message: "invalid credentials",
    };
  }

  const { accessToken, refreshToken } = await authenticate(user.id);

  return {
    code: "SUCCESS",
    user,
    accessToken,
    refreshToken,
  };
}

export async function refreshFn({
  refreshToken: token,
}: RefreshTokenJson): Promise<RefreshTokenResponse> {
  const payload = await verifyJwt(token);
  if (!payload) {
    return {
      code: "UNAUTHORIZED",
      message: "Invalid Token",
    };
  }

  const key = USER_SID(payload.sub);
  const exists = await redis.sismember(key, hashJwt(token));
  if (!exists) {
    return {
      code: "UNAUTHORIZED",
      message: "Token Reuse Detected",
    };
  }

  const { accessToken, refreshToken } = await refreshTokens({
    key,
    token,
    userId: payload.sub,
  });

  return {
    code: "SUCCESS",
    accessToken,
    refreshToken,
  };
}

export type RegisterResponse =
  | {
      code: "SUCCESS";
      user: User;
      message: "user registered successfully";
    }
  | {
      code: "EMAIL_ALREADY_IN_USE";
      path: ["email"];
      message: "email already in use";
    }
  | {
      code: "INTERNAL_SERVER_ERROR";
      message: string;
    };

export type LoginResponse =
  | {
      code: "SUCCESS";
      user: User;
      accessToken: string;
      refreshToken: string;
    }
  | {
      code: "INVALID_CREDENTIALS";
      path: ["email"];
      message: "invalid credentials";
    }
  | {
      code: "INTERNAL_SERVER_ERROR";
      message: string;
    };

export type RefreshTokenResponse =
  | {
      code: "SUCCESS";
      accessToken: string;
      refreshToken: string;
    }
  | {
      code: "UNAUTHORIZED";
      message: string;
    }
  | {
      code: "INTERNAL_SERVER_ERROR";
      message: string;
    };
