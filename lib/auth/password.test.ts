import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { describe, expect, it } from "vitest";

describe("пароль", () => {
  it("хранит только хэш и сверяет пароль", async () => {
    const password = "correct horse";
    const hash = await hashPassword(password, 4);
    expect(hash).not.toContain(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });
});
