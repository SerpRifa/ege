import { assertEntryDateIsToday, parseCounts, parseSubject } from "@/lib/server/validation";
import { describe, expect, it } from "vitest";

describe("валидация записи", () => {
  it("принимает неотрицательные целые и требует хотя бы одно задание", () => {
    expect(parseCounts("2", 0, "0")).toEqual({ countA: 2, countB: 0, countC: 0 });
    expect(() => parseCounts(0, 0, 0)).toThrow(/хотя бы одно/);
    expect(() => parseCounts(-1, 0, 0)).toThrow(/целым/);
    expect(() => parseCounts("1.5", 0, 0)).toThrow(/целым/);
    expect(parseSubject("math")).toBe("math");
    expect(() => parseSubject("history")).toThrow(/предмет/);
  });

  it("запрещает вчера и будущее", () => {
    expect(() => assertEntryDateIsToday("2026-11-14", "2026-11-15")).toThrow(/только за сегодня/);
    expect(() => assertEntryDateIsToday("2026-11-16", "2026-11-15")).toThrow(/только за сегодня/);
    expect(() => assertEntryDateIsToday("2026-11-15", "2026-11-15")).not.toThrow();
  });
});
