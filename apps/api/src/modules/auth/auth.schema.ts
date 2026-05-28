import z from "zod";

export const registerSchema = z.object({
  email: z.email().trim(),
  password: z.string().trim(),
});

export const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().trim(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim(),
});

export type RegisterJson = z.infer<typeof registerSchema>;
export type LoginJson = z.infer<typeof loginSchema>;
export type RefreshTokenJson = z.infer<typeof refreshTokenSchema>;
