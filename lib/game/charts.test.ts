import { buildCharts } from "@/lib/game/charts";
import { todayObligation } from "@/lib/game/schedule";
import type { GameEntry } from "@/lib/game/types";
import { describe, expect, it } from "vitest";

function entry(
  subject: GameEntry["subject"],
  date: string,
  counts: Partial<Pick<GameEntry, "countA" | "countB" | "countC">> = {},
): GameEntry {
  return {
    subject,
    date,
    countA: counts.countA ?? 0,
    countB: counts.countB ?? 0,
    countC: counts.countC ?? 0,
  };
}

describe("графики и слот дня", () => {
  it("группирует XP по неделям, предметам и вкладу A/B/C", () => {
    const entries = [
      entry("informatics", "2026-11-09", { countB: 1 }),
      entry("math", "2026-11-10", { countA: 5 }),
    ];
    const charts = buildCharts(entries, "2026-11-15");
    const week = charts.weeks.find((item) => item.weekStart === "2026-11-09");
    expect(week).toMatchObject({ informatics: 10, math: 5, russian: 0, total: 15 });
    expect(charts.bySubject).toEqual([
      { subject: "informatics", xp: 10 },
      { subject: "math", xp: 5 },
      { subject: "russian", xp: 0 },
    ]);
    expect(charts.byCategory).toEqual([
      { category: "A", xp: 5 },
      { category: "B", xp: 10 },
      { category: "C", xp: 0 },
    ]);
  });

  it("помечает обязательный слот выполненным, пропущенным, ожидающим и доп. занятие", () => {
    const entries = [
      entry("informatics", "2026-11-09", { countB: 1 }),
      entry("math", "2026-11-10", { countA: 3 }),
    ];
    const charts = buildCharts(entries, "2026-11-12");
    const byDate = Object.fromEntries(charts.calendar.map((day) => [day.date, day]));

    expect(byDate["2026-11-09"]?.requiredState).toBe("done");
    expect(byDate["2026-11-10"]?.requiredState).toBeNull();
    expect(byDate["2026-11-10"]?.hasExtra).toBe(true);
    expect(byDate["2026-11-11"]?.requiredState).toBe("missed");
    expect(byDate["2026-11-12"]?.requiredState).toBe("pending");

    expect(todayObligation(entries, "2026-11-12")).toMatchObject({
      required: true,
      subject: "russian",
      done: false,
    });
    expect(todayObligation(entries, "2026-11-15").required).toBe(false);
  });
});
