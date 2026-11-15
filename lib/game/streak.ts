import { entryXp, streakRules } from "@/config/game";
import { addDays, isoWeekday } from "@/lib/game/dates";
import type { GameEntry, SubjectId } from "@/lib/game/types";

export type StreakConfig = {
  schedule: Partial<Record<number, SubjectId>>;
  minSessionXp: number;
};

const LOOKBACK_DAYS = 4000;

export function subjectDayXp(
  entries: readonly GameEntry[],
  subject: SubjectId,
  date: string,
): number {
  return entries.reduce((sum, entry) => {
    if (entry.subject !== subject || entry.date !== date) return sum;
    return sum + entryXp(entry);
  }, 0);
}

export function isSlotDone(
  entries: readonly GameEntry[],
  date: string,
  subject: SubjectId,
  minSessionXp: number,
): boolean {
  return subjectDayXp(entries, subject, date) >= minSessionXp;
}

export function computeStreak(
  entries: readonly GameEntry[],
  today: string,
  config: StreakConfig = streakRules,
): number {
  let streak = 0;
  let cursor = today;

  for (let step = 0; step < LOOKBACK_DAYS; step += 1) {
    const subject = config.schedule[isoWeekday(cursor)];
    if (subject) {
      const done = isSlotDone(entries, cursor, subject, config.minSessionXp);
      if (cursor === today && !done) {
        // Сегодняшний обязательный слот не считается пропуском до конца дня.
      } else if (done) {
        streak += 1;
      } else {
        break;
      }
    }
    cursor = addDays(cursor, -1);
  }

  return streak;
}
