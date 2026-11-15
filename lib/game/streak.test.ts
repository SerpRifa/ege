import { entryXp, streakRules } from "@/config/game";
import { buildSnapshot } from "@/lib/game/progress";
import { computeStreak } from "@/lib/game/streak";
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

describe("серия обязательных занятий", () => {
  it("не обнуляет серию, пока сегодняшний слот ещё не закрыт", () => {
    const entries = [
      entry("informatics", "2026-11-09", { countB: 1 }),
      entry("math", "2026-11-11", { countB: 1 }),
    ];
    expect(computeStreak(entries, "2026-11-12", streakRules)).toBe(2);
  });

  it("пропуск обязательного слота обнуляет streak и не меняет XP", () => {
    const entries = [
      entry("informatics", "2026-11-09", { countB: 2 }),
      entry("math", "2026-11-11", { countB: 1 }),
    ];
    const xp = entries.reduce((sum, item) => sum + entryXp(item), 0);
    const snapshot = buildSnapshot(entries, "2026-11-13");

    expect(snapshot.streak).toBe(0);
    expect(snapshot.overall.totalXp).toBe(xp);
    expect(xp).toBe(30);
    expect(entries.reduce((sum, item) => sum + entryXp(item), 0)).toBe(xp);
  });

  it("после пропуска следующий выполненный слот начинает серию с 1", () => {
    const entries = [
      entry("informatics", "2026-11-09", { countB: 1 }),
      entry("math", "2026-11-11", { countB: 1 }),
      entry("informatics", "2026-11-16", { countB: 1 }),
    ];
    expect(computeStreak(entries, "2026-11-16", streakRules)).toBe(1);
    expect(buildSnapshot(entries, "2026-11-16").overall.totalXp).toBe(30);
  });

  it("считает сегодняшний выполненный слот и суммирует XP за день", () => {
    const entries = [
      entry("informatics", "2026-11-09", { countA: 4 }),
      entry("informatics", "2026-11-09", { countA: 6 }),
    ];
    expect(computeStreak(entries, "2026-11-09", streakRules)).toBe(1);
  });

  it("не принимает слот ниже minSessionXp", () => {
    const entries = [entry("informatics", "2026-11-09", { countA: 9 })];
    expect(computeStreak(entries, "2026-11-09", streakRules)).toBe(0);
  });

  it("дополнительное занятие в свободный день не ломает серию и даёт XP", () => {
    const entries = [
      entry("informatics", "2026-11-09", { countB: 1 }),
      entry("math", "2026-11-10", { countA: 5 }),
      entry("math", "2026-11-11", { countB: 1 }),
    ];
    const snapshot = buildSnapshot(entries, "2026-11-12");

    expect(snapshot.streak).toBe(2);
    expect(snapshot.overall.totalXp).toBe(25);
    expect(snapshot.subjects.math.totalXp).toBe(15);
    expect(snapshot.satisfiedAchievementIds).toContain("extra_session");
    expect(snapshot.satisfiedAchievementIds).toContain("first_session");
  });
});
