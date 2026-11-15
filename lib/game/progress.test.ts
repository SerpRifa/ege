import { entryXp, xpToNext } from "@/config/game";
import { cumulativeXpToReach, levelFromXp, statusFromLevel } from "@/lib/game/progress";
import { describe, expect, it } from "vitest";

const xpTable: readonly [level: number, toNext: number, cumulativeToNextLevel: number][] = [
  [1, 10, 10],
  [2, 28, 38],
  [3, 52, 90],
  [4, 80, 170],
  [5, 112, 282],
  [6, 147, 429],
  [7, 185, 614],
  [8, 226, 840],
  [9, 270, 1110],
  [10, 316, 1426],
  [11, 365, 1791],
  [12, 416, 2207],
  [13, 469, 2676],
  [14, 524, 3200],
  [15, 581, 3781],
];

describe("xp и уровни", () => {
  it("считает XP записи A/B/C", () => {
    expect(entryXp({ countA: 5, countB: 2, countC: 1 })).toBe(75);
    expect(entryXp({ countA: 0, countB: 0, countC: 0 })).toBe(0);
  });

  it("совпадает с таблицей xpToNext и накопленного XP", () => {
    expect(cumulativeXpToReach(1)).toBe(0);
    for (const [level, toNext, cumulative] of xpTable) {
      expect(xpToNext(level)).toBe(toNext);
      expect(cumulativeXpToReach(level + 1)).toBe(cumulative);
    }
  });

  it("раскладывает 75 XP в уровень 3 и прогресс 37/52", () => {
    expect(levelFromXp(75)).toEqual({
      level: 3,
      xpIntoLevel: 37,
      xpToNext: 52,
      progress01: 37 / 52,
    });
  });

  it("на пороге уровня оставляет нулевой прогресс нового уровня", () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, xpIntoLevel: 0, xpToNext: 10 });
    expect(levelFromXp(10)).toMatchObject({ level: 2, xpIntoLevel: 0, xpToNext: 28 });
    expect(levelFromXp(170).level).toBe(5);
    expect(levelFromXp(3199).level).toBe(14);
    expect(levelFromXp(3200)).toMatchObject({ level: 15, xpIntoLevel: 0 });
  });

  it("назначает статус по наибольшему достигнутому minLevel", () => {
    expect(statusFromLevel(1)).toBe("botik");
    expect(statusFromLevel(2)).toBe("botik");
    expect(statusFromLevel(3)).toBe("nubik");
    expect(statusFromLevel(levelFromXp(170).level)).toBe("normis");
    expect(statusFromLevel(levelFromXp(3199).level)).toBe("sigma");
    expect(statusFromLevel(levelFromXp(3200).level)).toBe("gigachad");
    expect(statusFromLevel(40)).toBe("gigachad");
  });
});
