import { config as loadEnv } from "dotenv";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth/password";
import { getDb } from "../lib/db/client";
import { users } from "../lib/db/schema";

loadEnv({ path: ".env.local" });
loadEnv();

type SeedUser = {
  login: string;
  password: string;
  displayName: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Не задана переменная ${name}`);
  }
  return value;
}

function readUsers(): SeedUser[] {
  return [1, 2].map((index) => ({
    login: required(`SEED_USER${index}_LOGIN`),
    password: required(`SEED_USER${index}_PASSWORD`),
    displayName: required(`SEED_USER${index}_NAME`),
  }));
}

async function main() {
  const updateExisting = process.argv.includes("--update");
  const specs = readUsers();
  const db = getDb();

  for (const spec of specs) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.login, spec.login)).limit(1);
    const row = existing[0];

    if (row && !updateExisting) {
      console.log(`skip ${spec.login}`);
      continue;
    }

    const passwordHash = await hashPassword(spec.password);

    if (row) {
      await db
        .update(users)
        .set({ passwordHash, displayName: spec.displayName })
        .where(eq(users.id, row.id));
      console.log(`updated ${spec.login}`);
      continue;
    }

    await db.insert(users).values({
      id: crypto.randomUUID(),
      login: spec.login,
      passwordHash,
      displayName: spec.displayName,
    });
    console.log(`created ${spec.login}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "seed failed";
  console.error(message);
  process.exit(1);
});
