import { addDays, isoWeekday, weekStart } from "@/lib/game/dates";
import type { AchievementContext, GameEntry, SubjectId } from "@/lib/game/types";

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  check: (ctx: AchievementContext) => boolean;
};

type EntryXp = (entry: Pick<GameEntry, "countA" | "countB" | "countC">) => number;

const SUBJECTS: readonly SubjectId[] = ["informatics", "math", "russian"];

function sumCount(entries: readonly GameEntry[], pick: (entry: GameEntry) => number): number {
  return entries.reduce((sum, entry) => sum + pick(entry), 0);
}

export function defineAchievements(deps: {
  schedule: Partial<Record<number, SubjectId>>;
  minSessionXp: number;
  entryXp: EntryXp;
}): AchievementDef[] {
  const dayXp = (entries: readonly GameEntry[], subject: SubjectId, date: string) =>
    entries.reduce((sum, entry) => {
      if (entry.subject !== subject || entry.date !== date) return sum;
      return sum + deps.entryXp(entry);
    }, 0);

  const slotDone = (entries: readonly GameEntry[], date: string, subject: SubjectId) =>
    dayXp(entries, subject, date) >= deps.minSessionXp;

  return [
    {
      id: "first_session",
      title: "Первое занятие",
      description: "Есть хотя бы одна запись занятия",
      check: (ctx) => ctx.entries.length > 0,
    },
    {
      id: "streak_3",
      title: "Серия 3",
      description: "Три обязательных занятия подряд",
      check: (ctx) => ctx.streak >= 3,
    },
    {
      id: "streak_10",
      title: "Серия 10",
      description: "Десять обязательных занятий подряд",
      check: (ctx) => ctx.streak >= 10,
    },
    {
      id: "streak_30",
      title: "Серия 30",
      description: "Тридцать обязательных занятий подряд",
      check: (ctx) => ctx.streak >= 30,
    },
    {
      id: "perfect_week",
      title: "Идеальная неделя",
      description: "В одной календарной неделе закрыты все обязательные слоты",
      check: (ctx) => {
        const slots = Object.entries(deps.schedule).flatMap(([weekday, subject]) =>
          subject ? [{ weekday: Number(weekday), subject }] : [],
        );
        if (slots.length === 0) return false;
        const weeks = new Set(ctx.entries.map((entry) => weekStart(entry.date)));
        for (const start of weeks) {
          const complete = slots.every((slot) =>
            slotDone(ctx.entries, addDays(start, slot.weekday - 1), slot.subject),
          );
          if (complete) return true;
        }
        return false;
      },
    },
    {
      id: "first_c",
      title: "Первая часть C",
      description: "Решено хотя бы одно задание C",
      check: (ctx) => sumCount(ctx.entries, (entry) => entry.countC) >= 1,
    },
    {
      id: "ten_c",
      title: "Десять C",
      description: "Суммарно решено 10 заданий C",
      check: (ctx) => sumCount(ctx.entries, (entry) => entry.countC) >= 10,
    },
    {
      id: "hundred_a",
      title: "Сотня A",
      description: "Суммарно решено 100 заданий A",
      check: (ctx) => sumCount(ctx.entries, (entry) => entry.countA) >= 100,
    },
    {
      id: "extra_session",
      title: "Дополнительное",
      description: "Есть занятие вне обязательного слота своего предмета",
      check: (ctx) =>
        ctx.entries.some((entry) => {
          const scheduled = deps.schedule[isoWeekday(entry.date)];
          if (!scheduled) return true;
          return entry.subject !== scheduled;
        }),
    },
    {
      id: "status_up",
      title: "Эволюция",
      description: "Статус хотя бы одного предмета выше Ботика",
      check: (ctx) => SUBJECTS.some((subject) => ctx.subjects[subject].statusId !== "botik"),
    },
    {
      id: "subject_gigachad",
      title: "Гигачад предмета",
      description: "Хотя бы один предмет достиг статуса Гигачад",
      check: (ctx) => SUBJECTS.some((subject) => ctx.subjects[subject].statusId === "gigachad"),
    },
    {
      id: "all_gigachad",
      title: "Три гигачада",
      description: "Все три предмета в статусе Гигачад",
      check: (ctx) => SUBJECTS.every((subject) => ctx.subjects[subject].statusId === "gigachad"),
    },
  ];
}
