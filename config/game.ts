import { defineAchievements } from "@/lib/game/achievement-defs";
import type { StatusId, SubjectId, TrackId } from "@/lib/game/types";

export const timezone = "Asia/Yekaterinburg";

export const xpWeights = {
  A: 1,
  B: 10,
  C: 50,
} as const;

export const minSessionXp = 10;

export const levelCurve = {
  multiplier: 10,
  exponent: 1.5,
} as const;

export function xpToNext(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error("Уровень должен быть целым числом от 1");
  }
  return Math.round(levelCurve.multiplier * level ** levelCurve.exponent);
}

export function entryXp(entry: { countA: number; countB: number; countC: number }): number {
  return entry.countA * xpWeights.A + entry.countB * xpWeights.B + entry.countC * xpWeights.C;
}

export const subjects = [
  { id: "informatics", title: "Информатика", weekday: 1 },
  { id: "math", title: "Математика (профиль)", weekday: 3 },
  { id: "russian", title: "Русский язык", weekday: 4 },
] as const satisfies readonly { id: SubjectId; title: string; weekday: number }[];

export const subjectIds = subjects.map((subject) => subject.id);

const subjectIdSet = new Set<string>(subjectIds);

export function isSubjectId(value: string): value is SubjectId {
  return subjectIdSet.has(value);
}

export function subjectTitle(subject: SubjectId): string {
  const found = subjects.find((item) => item.id === subject);
  if (!found) throw new Error(`Неизвестный предмет: ${subject}`);
  return found.title;
}

export const schedule: Record<number, SubjectId> = {
  1: "informatics",
  3: "math",
  4: "russian",
};

export const statuses = [
  { id: "botik", title: "Ботик", minLevel: 1 },
  { id: "nubik", title: "Нубик", minLevel: 3 },
  { id: "normis", title: "Нормис", minLevel: 5 },
  { id: "sharyashiy", title: "Шарящий", minLevel: 7 },
  { id: "tasher", title: "Тащер", minLevel: 10 },
  { id: "sigma", title: "Сигма", minLevel: 12 },
  { id: "gigachad", title: "Гигачад", minLevel: 15 },
] as const satisfies readonly { id: StatusId; title: string; minLevel: number }[];

export const statusIds = statuses.map((status) => status.id);

export const statusOverrides: Partial<Record<SubjectId, Partial<Record<StatusId, string>>>> = {};

export function statusTitle(statusId: StatusId, track: TrackId = "overall"): string {
  if (track !== "overall") {
    const override = statusOverrides[track]?.[statusId];
    if (override) return override;
  }
  const found = statuses.find((status) => status.id === statusId);
  if (!found) throw new Error(`Неизвестный статус: ${statusId}`);
  return found.title;
}

export const streakRules = {
  schedule,
  minSessionXp,
};

export const achievements = defineAchievements({
  schedule,
  minSessionXp,
  entryXp,
});
