import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";
import formatError from "~/utils/format-error";
import STATUS_CODE from "~/utils/status-code";

export default function <
  T extends ZodType,
  Target extends keyof ValidationTargets,
>(target: Target, schema: T) {
  return zValidator(target, schema, (result, ctx) => {
    if (!result.success) {
      return ctx.json(
        formatError(result.error.issues),
        STATUS_CODE.UNPROCESSABLE_ENTITY,
      );
    }
  });
}
