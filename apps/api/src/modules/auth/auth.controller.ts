import postgres from "postgres";
import { redis } from "src/config/redis";
import { hashJwt, verifyJwt } from "src/lib/jwt";
import { comparePassword, hashPassword } from "src/lib/password";
import type { PublicUser } from "src/modules/users/users.schema";
import {
  createUser,
  findUserByEmail,
  getPublicUserFields,
} from "src/modules/users/users.service";
import { tryCatch } from "src/utils/try-catch";
import { USER_SID } from "./auth.cache";
import type {
  LoginJson,
  LogoutJson,
  RefreshTokenJson,
  RegisterJson,
} from "./auth.schema";
import { authenticate, refreshTokens } from "./auth.service";

export async function register_controller(
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
    user: getPublicUserFields(user),
  };
}

export async function login_controller(
  data: LoginJson,
): Promise<LoginResponse> {
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
    user: getPublicUserFields(user),
    accessToken,
    refreshToken,
  };
}

export async function refresh_controller({
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

export async function logout_controller(
  values: LogoutJson,
): Promise<LogoutResponse> {
  const payload = await verifyJwt(values.refreshToken);

  if (!payload) {
    return {
      code: "UNAUTHORIZED",
      message: "unauthorized",
    };
  }

  const { error } = await tryCatch(
    redis.srem(USER_SID(payload.sub), hashJwt(values.refreshToken)),
  );

  if (error) {
    return {
      code: "INTERNAL_SERVER_ERROR",
      message: "internal server error",
    };
  }

  return {
    code: "SUCCESS",
    message: "user logged out successfully",
  };
}

export type RegisterResponse =
  | {
      code: "SUCCESS";
      user: PublicUser;
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
      user: PublicUser;
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

export type LogoutResponse =
  | {
      code: "SUCCESS";
      message: "user logged out successfully";
    }
  | {
      code: "INTERNAL_SERVER_ERROR";
      message: "internal server error";
    }
  | {
      code: "UNAUTHORIZED";
      message: "unauthorized";
    };
