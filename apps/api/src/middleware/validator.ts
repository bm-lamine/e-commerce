import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import formatErrors from "src/utils/format-errors";
import STATUS_CODE from "src/utils/status-code";
import type { ZodType } from "zod";

export default function <
  T extends ZodType,
  Target extends keyof ValidationTargets,
>(target: Target, schema: T) {
  return zValidator(target, schema, (result, ctx) => {
    if (!result.success) {
      return ctx.json(
        formatErrors(result.error.issues),
        STATUS_CODE.UNPROCESSABLE_ENTITY,
      );
    }
  });
}
