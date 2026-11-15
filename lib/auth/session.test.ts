import { signSession, verifySession } from "@/lib/auth/session";
import { describe, expect, it } from "vitest";

const secret = "test-secret-value";

describe("сессия", () => {
  it("подписывает и читает userId", async () => {
    const token = await signSession("user-1", secret, 1_000);
    await expect(verifySession(token, secret, 1_000)).resolves.toEqual({ userId: "user-1" });
  });

  it("отклоняет чужую подпись, порчу и истёкший срок", async () => {
    const token = await signSession("user-1", secret, 1_000);
    await expect(verifySession(token, "other-secret", 1_000)).resolves.toBeNull();
    await expect(verifySession(`${token}x`, secret, 1_000)).resolves.toBeNull();
    await expect(verifySession(token, secret, 1_000 + 60 * 60 * 24 * 30 * 1000)).resolves.toBeNull();
    await expect(verifySession(token, "", 1_000)).resolves.toBeNull();
  });
});
