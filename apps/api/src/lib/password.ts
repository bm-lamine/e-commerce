export async function hashPassword(plain: string) {
  return await Bun.password.hash(plain, "argon2id");
}

export async function comparePassword(plain: string, hash: string) {
  return await Bun.password.verify(plain, hash, "argon2id");
}
