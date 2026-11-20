import {
  achievements,
  entryXp,
  statusTitle,
  statuses,
  subjectIds,
  subjectTitle,
  xpToNext,
} from "@/config/game";
import { computeStreak } from "@/lib/game/streak";
import type {
  AchievementContext,
  GameEntry,
  LevelProgress,
  ProgressSnapshot,
  StatusId,
  SubjectId,
  TrackId,
  TrackProgress,
} from "@/lib/game/types";

export function cumulativeXpToReach(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error("Уровень должен быть целым числом от 1");
  }
  let sum = 0;
  for (let current = 1; current < level; current += 1) {
    sum += xpToNext(current);
  }
  return sum;
}

export function levelFromXp(totalXp: number): LevelProgress {
  if (!Number.isFinite(totalXp) || totalXp < 0) {
    throw new Error("XP не может быть отрицательным");
  }
  let level = 1;
  let consumed = 0;
  while (level < 100_000) {
    const need = xpToNext(level);
    if (totalXp < consumed + need) {
      const xpIntoLevel = totalXp - consumed;
      return {
        level,
        xpIntoLevel,
        xpToNext: need,
        progress01: need === 0 ? 0 : xpIntoLevel / need,
      };
    }
    consumed += need;
    level += 1;
  }
  throw new Error("Слишком большой XP");
}

export function statusFromLevel(level: number): StatusId {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error("Уровень должен быть целым числом от 1");
  }
  let best: (typeof statuses)[number] | undefined;
  for (const status of statuses) {
    if (level < status.minLevel) continue;
    if (!best || status.minLevel >= best.minLevel) best = status;
  }
  if (!best) throw new Error("В конфиге нет статуса для уровня 1");
  return best.id;
}

export function subjectTotalXp(entries: readonly GameEntry[], subject: SubjectId): number {
  return entries.reduce((sum, entry) => {
    if (entry.subject !== subject) return sum;
    return sum + entryXp(entry);
  }, 0);
}

export type SubjectTaskSummary = {
  subject: SubjectId;
  title: string;
  tasks: number;
  countA: number;
  countB: number;
  countC: number;
  xp: number;
};

export function summarizeSubjects(entries: readonly GameEntry[]): SubjectTaskSummary[] {
  return subjectIds.map((subject) => {
    let countA = 0;
    let countB = 0;
    let countC = 0;
    for (const entry of entries) {
      if (entry.subject !== subject) continue;
      countA += entry.countA;
      countB += entry.countB;
      countC += entry.countC;
    }
    return {
      subject,
      title: subjectTitle(subject),
      tasks: countA + countB + countC,
      countA,
      countB,
      countC,
      xp: entryXp({ countA, countB, countC }),
    };
  });
}

export function trackFromXp(totalXp: number, track: TrackId): TrackProgress {
  const level = levelFromXp(totalXp);
  const statusId = statusFromLevel(level.level);
  return {
    totalXp,
    ...level,
    statusId,
    statusTitle: statusTitle(statusId, track),
  };
}

export function buildSnapshot(entries: readonly GameEntry[], today: string): ProgressSnapshot {
  const subjects = {
    informatics: trackFromXp(subjectTotalXp(entries, "informatics"), "informatics"),
    math: trackFromXp(subjectTotalXp(entries, "math"), "math"),
    russian: trackFromXp(subjectTotalXp(entries, "russian"), "russian"),
  } satisfies Record<SubjectId, TrackProgress>;
  const overallXp = subjectIds.reduce((sum, subject) => sum + subjects[subject].totalXp, 0);
  const overall = trackFromXp(overallXp, "overall");
  const streak = computeStreak(entries, today);
  const ctx: AchievementContext = { entries, overall, subjects, streak };
  return {
    overall,
    subjects,
    streak,
    satisfiedAchievementIds: achievements.filter((item) => item.check(ctx)).map((item) => item.id),
  };
}

export function statusLadder(track: TrackId, level: number) {
  const current = statusFromLevel(level);
  return statuses.map((status) => ({
    id: status.id,
    title: statusTitle(status.id, track),
    minLevel: status.minLevel,
    cumulativeXp: cumulativeXpToReach(status.minLevel),
    state: (status.id === current ? "current" : level >= status.minLevel ? "reached" : "locked") as
      | "current"
      | "reached"
      | "locked",
  }));
}

export function newlyUnlockedIds(
  alreadyUnlocked: readonly string[],
  satisfiedIds: readonly string[],
): string[] {
  const owned = new Set(alreadyUnlocked);
  return satisfiedIds.filter((id) => !owned.has(id));
}

export { entryXp, xpToNext };
