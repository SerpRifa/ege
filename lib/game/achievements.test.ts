import { buildSnapshot, newlyUnlockedIds } from "@/lib/game/progress";
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

describe("ачивки", () => {
  it("открывает серию 3 и идеальную неделю, но не серию 10", () => {
    const entries = [
      entry("informatics", "2026-11-09", { countB: 1 }),
      entry("math", "2026-11-11", { countB: 1 }),
      entry("russian", "2026-11-12", { countB: 1 }),
    ];
    const snapshot = buildSnapshot(entries, "2026-11-12");
    expect(snapshot.streak).toBe(3);
    expect(snapshot.satisfiedAchievementIds).toEqual(
      expect.arrayContaining(["first_session", "streak_3", "perfect_week"]),
    );
    expect(snapshot.satisfiedAchievementIds).not.toContain("streak_10");
    expect(snapshot.satisfiedAchievementIds).not.toContain("extra_session");
  });

  it("считает задания C и A и смену предметного статуса", () => {
    const entries = [entry("math", "2026-11-10", { countA: 100, countC: 1 })];
    const snapshot = buildSnapshot(entries, "2026-11-10");
    expect(snapshot.subjects.math.level).toBeGreaterThanOrEqual(3);
    expect(snapshot.subjects.math.statusId).not.toBe("botik");
    expect(snapshot.satisfiedAchievementIds).toEqual(
      expect.arrayContaining(["first_c", "hundred_a", "extra_session", "status_up"]),
    );
    expect(snapshot.satisfiedAchievementIds).not.toContain("ten_c");
  });

  it("отличает одного гигачада от трёх", () => {
    const one = buildSnapshot(
      [entry("russian", "2026-11-12", { countC: 64 })],
      "2026-11-12",
    );
    expect(one.subjects.russian.statusId).toBe("gigachad");
    expect(one.satisfiedAchievementIds).toContain("subject_gigachad");
    expect(one.satisfiedAchievementIds).not.toContain("all_gigachad");

    const all = buildSnapshot(
      [
        entry("informatics", "2026-11-09", { countC: 64 }),
        entry("math", "2026-11-11", { countC: 64 }),
        entry("russian", "2026-11-12", { countC: 64 }),
      ],
      "2026-11-12",
    );
    expect(all.satisfiedAchievementIds).toContain("all_gigachad");
  });

  it("возвращает только новые id и не дублирует уже выданные", () => {
    expect(newlyUnlockedIds(["first_session"], ["first_session", "extra_session"])).toEqual([
      "extra_session",
    ]);
    expect(newlyUnlockedIds(["first_session", "extra_session"], ["first_session"])).toEqual([]);
  });
});
