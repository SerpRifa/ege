import { describe, expect, it } from "vitest";
import { databaseTarget, describeError, errorChain } from "@/lib/log";

describe("логи ошибок", () => {
  it("склеивает цепочку cause и код postgres", () => {
    const cause = Object.assign(new TypeError("fetch failed"), { code: "ECONNREFUSED" });
    const error = new Error("Error connecting to database", { cause });
    expect(errorChain(error)).toBe(
      "Error: Error connecting to database ← TypeError: fetch failed [ECONNREFUSED]",
    );
    expect(describeError(error)).toMatchObject({
      name: "Error",
      message: "Error connecting to database",
      cause: { name: "TypeError", code: "ECONNREFUSED" },
    });
  });

  it("показывает хост без пароля", () => {
    const previous = process.env.DATABASE_URL;
    process.env.DATABASE_URL =
      "postgresql://postgres.ref:secret%40pass@aws-0-eu-central-1.pooler.supabase.com:5432/postgres";
    expect(databaseTarget()).toBe(
      "postgresql://aws-0-eu-central-1.pooler.supabase.com:5432/postgres",
    );
    expect(databaseTarget()).not.toContain("secret");
    process.env.DATABASE_URL = previous;
  });
});
