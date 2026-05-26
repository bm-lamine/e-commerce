import { showRoutes } from "hono/dev";
import app from "src/app";
import { env } from "src/config/env";

if (env.NODE_ENV !== "production") showRoutes(app);

export default {
  fetch: app.fetch,
  port: env.PORT,
};
