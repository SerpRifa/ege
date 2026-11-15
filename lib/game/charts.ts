import { entryXp, minSessionXp, schedule, xpWeights } from "@/config/game";
import { addDays, isoWeekday, weekStart } from "@/lib/game/dates";
import type { GameEntry, SubjectId } from "@/lib/game/types";

export type WeekXp = {
  weekStart: string;
  informatics: number;
  math: number;
  russian: number;
  total: number;
};

export type CalendarDay = {
  date: string;
  weekday: number;
  scheduledSubject: SubjectId | null;
  requiredState: "done" | "missed" | "pending" | null;
  hasExtra: boolean;
  xp: number;
};

export type ChartsData = {
  weeks: WeekXp[];
  bySubject: { subject: SubjectId; xp: number }[];
  byCategory: { category: "A" | "B" | "C"; xp: number }[];
  calendar: CalendarDay[];
};

function dayXp(entries: readonly GameEntry[], subject: SubjectId, date: string): number {
  return entries.reduce((sum, entry) => {
    if (entry.subject !== subject || entry.date !== date) return sum;
    return sum + entryXp(entry);
  }, 0);
}

function enumerateDays(start: string, end: string): string[] {
  const days: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function buildCharts(entries: readonly GameEntry[], today: string): ChartsData {
  const earliest = entries.reduce<string | null>(
    (min, entry) => (min === null || entry.date < min ? entry.date : min),
    null,
  );
  const rangeStart = weekStart(earliest && earliest < today ? earliest : today);
  const rangeEnd = addDays(weekStart(today), 6);

  const weekMap = new Map<string, WeekXp>();
  for (const date of enumerateDays(rangeStart, rangeEnd)) {
    if (isoWeekday(date) !== 1) continue;
    weekMap.set(date, { weekStart: date, informatics: 0, math: 0, russian: 0, total: 0 });
  }

  for (const entry of entries) {
    const start = weekStart(entry.date);
    const bucket = weekMap.get(start) ?? {
      weekStart: start,
      informatics: 0,
      math: 0,
      russian: 0,
      total: 0,
    };
    const xp = entryXp(entry);
    bucket[entry.subject] += xp;
    bucket.total += xp;
    weekMap.set(start, bucket);
  }

  const weeks = [...weekMap.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  const subjects: SubjectId[] = ["informatics", "math", "russian"];

  return {
    weeks,
    bySubject: subjects.map((subject) => ({
      subject,
      xp: entries.reduce((sum, entry) => (entry.subject === subject ? sum + entryXp(entry) : sum), 0),
    })),
    byCategory: [
      { category: "A", xp: entries.reduce((sum, entry) => sum + entry.countA * xpWeights.A, 0) },
      { category: "B", xp: entries.reduce((sum, entry) => sum + entry.countB * xpWeights.B, 0) },
      { category: "C", xp: entries.reduce((sum, entry) => sum + entry.countC * xpWeights.C, 0) },
    ],
    calendar: enumerateDays(rangeStart, rangeEnd).map((date) => {
      const weekday = isoWeekday(date);
      const scheduledSubject = schedule[weekday] ?? null;
      const dayEntries = entries.filter((entry) => entry.date === date);
      const xp = dayEntries.reduce((sum, entry) => sum + entryXp(entry), 0);
      const done = scheduledSubject ? dayXp(entries, scheduledSubject, date) >= minSessionXp : false;
      let requiredState: CalendarDay["requiredState"] = null;
      if (scheduledSubject) {
        if (done) requiredState = "done";
        else if (date >= today) requiredState = "pending";
        else requiredState = "missed";
      }
      const hasExtra = dayEntries.some((entry) => !scheduledSubject || entry.subject !== scheduledSubject);
      return { date, weekday, scheduledSubject, requiredState, hasExtra, xp };
    }),
  };
}
