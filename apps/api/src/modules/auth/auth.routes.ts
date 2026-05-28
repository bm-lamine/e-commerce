import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import type { JwtVariables } from "hono/jwt";
import validator from "src/middleware/validator";
import formatErrors from "src/utils/format-errors";
import STATUS_CODE from "src/utils/status-code";
import { loginFn, refreshFn, registerFn } from "./auth.controller";
import { loginSchema, refreshTokenSchema, registerSchema } from "./auth.schema";
import type { JwtPayload } from "./jwt/jwt.schema";

const authRoutes = new Hono<{
  Variables: JwtVariables<JwtPayload>;
}>({}).basePath("/v1");

authRoutes.post("/register", validator("json", registerSchema), async (c) => {
  const values = c.req.valid("json");
  const res = await registerFn(values);

  switch (res.code) {
    case "EMAIL_ALREADY_IN_USE":
      return c.json(
        formatErrors([{ path: res.path, message: res.message }]),
        STATUS_CODE.UNPROCESSABLE_ENTITY,
      );

    case "SUCCESS":
      return c.json(
        { user: res.user, message: res.message },
        STATUS_CODE.CREATED,
      );

    case "INTERNAL_SERVER_ERROR":
      return c.json(
        { message: res.message },
        STATUS_CODE.INTERNAL_SERVER_ERROR,
      );

    default:
      const _Ex: never = res;
      return _Ex;
  }
});

authRoutes.post("/login", validator("json", loginSchema), async (c) => {
  const values = c.req.valid("json");
  const res = await loginFn(values);

  switch (res.code) {
    case "INVALID_CREDENTIALS":
      return c.json(
        formatErrors([{ path: res.path, message: res.message }]),
        STATUS_CODE.UNPROCESSABLE_ENTITY,
      );

    case "SUCCESS":
      setCookie(c, "refreshToken", res.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });

      return c.json(
        { user: res.user, accessToken: res.accessToken },
        STATUS_CODE.OK,
      );

    case "INTERNAL_SERVER_ERROR":
      return c.json(
        { message: res.message },
        STATUS_CODE.INTERNAL_SERVER_ERROR,
      );

    default:
      const _Ex: never = res;
      return _Ex;
  }
});

authRoutes.post(
  "/refresh",
  validator("cookie", refreshTokenSchema),
  async (c) => {
    const values = c.req.valid("cookie");
    const res = await refreshFn(values);

    switch (res.code) {
      case "UNAUTHORIZED":
        return c.json({ message: res.message }, STATUS_CODE.UNAUTHORIZED);

      case "SUCCESS":
        setCookie(c, "refreshToken", res.refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "Strict",
        });

        return c.json({ accessToken: res.accessToken }, STATUS_CODE.OK);

      case "INTERNAL_SERVER_ERROR":
        return c.json(
          { message: res.message },
          STATUS_CODE.INTERNAL_SERVER_ERROR,
        );

      default:
        const _Ex: never = res;
        return _Ex;
    }
  },
);

export default authRoutes;
