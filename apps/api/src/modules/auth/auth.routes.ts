import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import type { JwtVariables } from "hono/jwt";
import type { JwtPayload } from "src/lib/jwt";
import validator from "src/middleware/validator";
import formatErrors from "src/utils/format-errors";
import STATUS_CODE from "src/utils/status-code";
import {
  login_controller,
  logout_controller,
  refresh_controller,
  register_controller,
} from "./auth.controller";
import {
  login_schema,
  logout_schema,
  refresh_schema,
  register_schema,
} from "./auth.schema";
import { requireAuth } from "src/middleware/require-auth";

const authRoutes = new Hono<{
  Variables: JwtVariables<JwtPayload>;
}>({}).basePath("/v1");

authRoutes.post("/register", validator("json", register_schema), async (c) => {
  const values = c.req.valid("json");
  const res = await register_controller(values);

  switch (res.code) {
    case "EMAIL_ALREADY_IN_USE":
      return c.json(
        formatErrors([{ ...res }]),
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

authRoutes.post("/login", validator("json", login_schema), async (c) => {
  const values = c.req.valid("json");
  const res = await login_controller(values);

  switch (res.code) {
    case "INVALID_CREDENTIALS":
      return c.json(
        formatErrors([{ ...res }]),
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

authRoutes.post("/refresh", validator("cookie", refresh_schema), async (c) => {
  const values = c.req.valid("cookie");
  const res = await refresh_controller(values);

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
});

authRoutes.post(
  "/logout",
  requireAuth,
  validator("cookie", logout_schema),
  async (c) => {
    const res = await logout_controller(c.req.valid("cookie"));

    switch (res.code) {
      case "SUCCESS":
        return c.json({ message: res.message }, STATUS_CODE.OK);

      case "UNAUTHORIZED":
        return c.json({ message: res.message }, STATUS_CODE.UNAUTHORIZED);

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
