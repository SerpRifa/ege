import { timezone } from "@/config/game";
import { addDays, formatDateInTimeZone, isoWeekday, weekStart } from "@/lib/game/dates";
import { describe, expect, it } from "vitest";

describe("календарь приложения", () => {
  it("считает ISO-день недели и понедельник недели", () => {
    expect(isoWeekday("2026-11-09")).toBe(1);
    expect(isoWeekday("2026-11-15")).toBe(7);
    expect(weekStart("2026-11-12")).toBe("2026-11-09");
    expect(addDays("2026-11-09", 3)).toBe("2026-11-12");
  });

  it("переводит момент времени в Asia/Yekaterinburg", () => {
    expect(formatDateInTimeZone(new Date("2026-11-15T18:59:00.000Z"), timezone)).toBe("2026-11-15");
    expect(formatDateInTimeZone(new Date("2026-11-15T19:30:00.000Z"), timezone)).toBe("2026-11-16");
  });
});
