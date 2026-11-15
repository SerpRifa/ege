import { minSessionXp, schedule, subjectTitle } from "@/config/game";
import { isoWeekday } from "@/lib/game/dates";
import { subjectDayXp } from "@/lib/game/streak";
import type { GameEntry, SubjectId } from "@/lib/game/types";

export type TodayObligation = {
  required: boolean;
  subject: SubjectId | null;
  title: string | null;
  done: boolean;
  xp: number;
  minSessionXp: number;
};

export function todayObligation(entries: readonly GameEntry[], today: string): TodayObligation {
  const subject = schedule[isoWeekday(today)] ?? null;
  if (!subject) {
    return { required: false, subject: null, title: null, done: false, xp: 0, minSessionXp };
  }
  const xp = subjectDayXp(entries, subject, today);
  return {
    required: true,
    subject,
    title: subjectTitle(subject),
    done: xp >= minSessionXp,
    xp,
    minSessionXp,
  };
}
