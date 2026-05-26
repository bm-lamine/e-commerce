export const USER_SID = (userId: string) => `auth:session:${userId}`;
export const ACCESS_TTL = 1 * 60 * 60;
export const REFRESH_TTL = 7 * 24 * 60 * 60;
