import { subjects } from "@/config/game";
import { CharacterPortrait } from "@/components/character-portrait";
import { XpBar } from "@/components/xp-bar";
import { isoWeekday } from "@/lib/game/dates";
import { getDashboard } from "@/lib/server/queries";
import { weekdayNames } from "@/lib/ui/format";
import type { SubjectId } from "@/lib/game/types";
import Link from "next/link";

const subjectDot: Record<SubjectId, string> = {
  informatics: "bg-informatics",
  math: "bg-math",
  russian: "bg-russian",
};

export default async function HomePage() {
  const data = await getDashboard();
  const overall = data.snapshot.overall;
  const weekday = weekdayNames[isoWeekday(data.today)] ?? "";

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 rounded-3xl bg-panel p-4 sm:grid-cols-[180px_1fr] sm:items-center">
        <CharacterPortrait track="overall" statusId={overall.statusId} size={180} animateIdle />
        <div className="grid gap-3">
          <p className="text-sm uppercase tracking-wide text-muted">Общий статус</p>
          <h1 className="font-display text-4xl">{overall.statusTitle}</h1>
          <p className="text-lg">Уровень {overall.level}</p>
          <XpBar
            progress={overall.progress01}
            label={`${overall.xpIntoLevel} / ${overall.xpToNext} XP до следующего уровня`}
          />
          <p className="text-sm text-muted">Всего {overall.totalXp} XP</p>
        </div>
      </section>

      <section className="rounded-3xl bg-gold px-4 py-5 text-ink">
        <p className="text-sm font-medium uppercase tracking-wide">Серия</p>
        <p className="font-display text-5xl">{data.snapshot.streak}</p>
        <p>обязательных занятий подряд</p>
      </section>

      <section className="rounded-3xl border border-line bg-panel p-4">
        <h2 className="font-display text-2xl">Сегодня</h2>
        <p className="mt-1 capitalize text-muted">{weekday}</p>
        {data.todaySlot.required && data.todaySlot.subject ? (
          <p className="mt-3 text-lg">
            {data.todaySlot.title}:{" "}
            <span className={data.todaySlot.done ? "text-mint" : "text-gold"}>
              {data.todaySlot.done ? "выполнено" : "ещё нет"}
            </span>
          </p>
        ) : (
          <p className="mt-3">Свободный день. Обязательные занятия — в понедельник, среду и четверг.</p>
        )}
        {data.todaySlot.required ? (
          <p className="mt-1 text-sm text-muted">
            Нужно минимум {data.todaySlot.minSessionXp} XP по предмету дня. Сейчас {data.todaySlot.xp} XP.
          </p>
        ) : null}
        <Link
          href="/log"
          className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-cream px-4 font-semibold text-ink"
        >
          Записать занятие
        </Link>
      </section>

      <section className="overflow-hidden rounded-3xl border border-line bg-panel">
        <h2 className="px-4 pt-4 font-display text-2xl">Задания и очки</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] border-collapse text-left">
            <caption className="sr-only">Сколько заданий выполнено и сколько очков набрано по каждому предмету</caption>
            <thead>
              <tr className="text-sm text-muted">
                <th scope="col" className="px-4 py-3 font-medium">Предмет</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Заданий</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Очки</th>
              </tr>
            </thead>
            <tbody>
              {data.subjectStats.map((row) => (
                <tr key={row.subject} className="border-t border-line">
                  <th scope="row" className="px-4 py-3 font-medium">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${subjectDot[row.subject]}`} aria-hidden />
                      {row.subject === "math" ? "Математика" : row.title}
                    </span>
                    <span className="mt-1 block text-sm font-normal text-muted">
                      A {row.countA} · B {row.countB} · C {row.countC}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-right tabular-nums">{row.tasks}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.xp} XP</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line font-medium">
                <th scope="row" className="px-4 py-3">Всего</th>
                <td className="px-4 py-3 text-right tabular-nums">
                  {data.subjectStats.reduce((sum, row) => sum + row.tasks, 0)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{overall.totalXp} XP</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {subjects.map((subject) => {
          const track = data.snapshot.subjects[subject.id];
          return (
            <Link key={subject.id} href={`/subjects/${subject.id}`} className="grid gap-3 rounded-3xl bg-panel p-4">
              <div className="flex items-center gap-3">
                <CharacterPortrait track={subject.id} statusId={track.statusId} size={72} />
                <div>
                  <h2 className="font-medium">{subject.id === "math" ? "Математика" : subject.title}</h2>
                  <p className="text-sm text-muted">{track.statusTitle}</p>
                </div>
              </div>
              <p>Уровень {track.level}</p>
              <XpBar progress={track.progress01} label={`${track.totalXp} XP`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
