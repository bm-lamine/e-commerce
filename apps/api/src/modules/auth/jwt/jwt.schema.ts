import z from "zod";

export const payloadSchema = z.object({
  sub: z.nanoid().trim(),
});

export type JwtPayload = z.infer<typeof payloadSchema>;
