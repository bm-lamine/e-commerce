import { jwt } from "hono/jwt";
import { env } from "src/config/env";

export const requireAuth = jwt({
  alg: "HS256",
  secret: env.JWT_SECRET,
});
