import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function findUserByLogin(login: string): Promise<{ id: string; passwordHash: string } | null> {
  const rows = await getDb()
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.login, login))
    .limit(1);
  return rows[0] ?? null;
}

export async function findUserById(
  id: string,
): Promise<{ id: string; login: string; displayName: string } | null> {
  const rows = await getDb()
    .select({ id: users.id, login: users.login, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows[0] ?? null;
}
