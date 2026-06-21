import z from "zod";

export const register_schema = z.object({
  email: z.email().trim(),
  password: z.string().trim(),
});

export const login_schema = z.object({
  email: z.email().trim(),
  password: z.string().trim(),
});

export const refresh_schema = z.object({
  refreshToken: z.string().trim(),
});

export const logout_schema = z.object({
  refreshToken: z.string().trim(),
});

export type RegisterJson = z.infer<typeof register_schema>;
export type LoginJson = z.infer<typeof login_schema>;
export type RefreshTokenJson = z.infer<typeof refresh_schema>;
export type LogoutJson = z.infer<typeof logout_schema>;
