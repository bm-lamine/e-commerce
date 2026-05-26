import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import validator from "src/middleware/validator";
import formatError from "src/utils/format-error";
import STATUS_CODE from "src/utils/status-code";
import { loginFn, registerFn } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schema";

const authRoutes = new Hono().basePath("/v1");

authRoutes.post("/register", validator("json", registerSchema), async (c) => {
  const values = c.req.valid("json");
  const res = await registerFn(values);

  switch (res.code) {
    case "EMAIL_ALREADY_IN_USE":
      return c.json(formatError([res.data]), STATUS_CODE.UNPROCESSABLE_ENTITY);

    case "SUCCESS":
      return c.json(res.data, STATUS_CODE.CREATED);

    case "INTERNAL_SERVER_ERROR":
      throw new HTTPException(STATUS_CODE.INTERNAL_SERVER_ERROR, {
        message: res.message,
      });

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
      return c.json(formatError([res.data]), STATUS_CODE.UNPROCESSABLE_ENTITY);

    case "SUCCESS":
      setCookie(c, "refresh_token", res.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });
      return c.json(res.data, STATUS_CODE.CREATED);

    case "INTERNAL_SERVER_ERROR":
      throw new HTTPException(STATUS_CODE.INTERNAL_SERVER_ERROR, {
        message: res.message,
      });

    default:
      const _Ex: never = res;
      return _Ex;
  }
});

export default authRoutes;
