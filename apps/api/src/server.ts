import { showRoutes } from "hono/dev";
import app from "~/app";
import { env } from "~/config/env";

if (env.NODE_ENV !== "production") showRoutes(app);

export default {
  fetch: app.fetch,
  port: env.PORT,
};
