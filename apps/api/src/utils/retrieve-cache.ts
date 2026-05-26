import { redis } from "src/config/redis";
import { z, type ZodType } from "zod";

export async function retrieveCache<T extends ZodType>({
  key,
  schema,
  del = false,
}: RetrieveCacheOptions<T>) {
  const fn = () => (del ? redis.getdel(key) : redis.get(key));
  const cached = await fn();
  if (!cached) return null;

  const parsed = schema.safeParse(JSON.parse(cached));
  if (!parsed.success) {
    console.error("Malformed Cache", z.treeifyError(parsed.error));
    return null;
  }

  return parsed.data;
}

type RetrieveCacheOptions<T extends ZodType> = {
  key: string;
  schema: T;
  del?: boolean;
};
