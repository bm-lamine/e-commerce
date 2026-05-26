import postgres from "postgres";
import type { User } from "src/modules/users/users.schema";
import { createUser, findUserByEmail } from "src/modules/users/users.service";
import { tryCatch } from "src/utils/try-catch";
import type { LoginJson, RegisterJson } from "./auth.schema";
import { authenticate, comparePassword, hashPassword } from "./auth.service";

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
    if (pgError instanceof postgres.PostgresError && pgError.code === "23505") {
      return {
        code: "EMAIL_ALREADY_IN_USE",
        data: { path: ["email"], message: "email already in use" },
      };
    }

    return {
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    };
  }

  return {
    code: "SUCCESS",
    data: { user, message: "user registered successfully" },
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
      data: { path: ["email"], message: "invalid credentials" },
    };
  }

  const { accessToken, refreshToken } = await authenticate(user.id);
  return {
    code: "SUCCESS",
    data: { user, accessToken },
    refreshToken,
  };
}

export type RegisterResponse =
  | {
      code: "SUCCESS";
      data: { user: User; message: "user registered successfully" };
    }
  | {
      code: "EMAIL_ALREADY_IN_USE";
      data: { path: ["email"]; message: "email already in use" };
    }
  | {
      code: "INTERNAL_SERVER_ERROR";
      message: string;
    };

export type LoginResponse =
  | {
      code: "SUCCESS";
      data: { user: User; accessToken: string };
      refreshToken: string;
    }
  | {
      code: "INVALID_CREDENTIALS";
      data: { path: ["email"]; message: "invalid credentials" };
    }
  | { code: "INTERNAL_SERVER_ERROR"; message: string };
