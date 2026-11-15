import { isSubjectId } from "@/config/game";
import { CharacterPortrait } from "@/components/character-portrait";
import { DeleteEntryButton } from "@/components/delete-entry-button";
import { XpBar } from "@/components/xp-bar";
import { getSubject } from "@/lib/server/queries";
import { formatRuDate } from "@/lib/ui/format";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  if (!isSubjectId(subject)) notFound();
  const data = await getSubject(subject);
  const progress = data.progress;
  if (!progress) notFound();

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 rounded-3xl bg-panel p-4 sm:grid-cols-[180px_1fr] sm:items-center">
        <CharacterPortrait track={subject} statusId={progress.statusId} size={180} animateIdle />
        <div className="grid gap-3">
          <p className="text-sm text-muted">{data.title}</p>
          <h1 className="font-display text-4xl">{progress.statusTitle}</h1>
          <p>Уровень {progress.level}</p>
          <XpBar
            progress={progress.progress01}
            label={`${progress.xpIntoLevel} / ${progress.xpToNext} XP`}
          />
        </div>
      </section>

      <section className="rounded-3xl bg-panel p-4">
        <h2 className="mb-3 font-display text-2xl">Статусы</h2>
        <ol className="grid gap-2">
          {data.ladder.map((step) => (
            <li
              key={step.id}
              className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-3 ${
                step.state === "current"
                  ? "bg-gold text-ink"
                  : step.state === "reached"
                    ? "bg-panel-2"
                    : "bg-ink/40 text-muted"
              }`}
            >
              <span>
                {step.title}
                <span className="ml-2 text-sm opacity-80">с уровня {step.minLevel}</span>
              </span>
              <span className="text-sm">{step.state === "locked" ? "закрыт" : step.state === "current" ? "сейчас" : "открыт"}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl bg-panel p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">История</h2>
          <Link href={`/log?subject=${subject}`} className="rounded-xl bg-cream px-3 py-2 text-sm font-medium text-ink">
            Записать
          </Link>
        </div>
        {data.entries.length === 0 ? (
          <p className="text-muted">Пока нет занятий по этому предмету.</p>
        ) : (
          <ul className="grid gap-2">
            {data.entries.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-panel-2 px-3 py-3">
                <div>
                  <p>{formatRuDate(entry.date)}</p>
                  <p className="text-sm text-muted">
                    A {entry.countA} · B {entry.countB} · C {entry.countC} · {entry.xp} XP
                  </p>
                </div>
                {entry.date === data.today ? (
                  <div className="flex items-center gap-2">
                    <Link href={`/log?subject=${subject}`} className="min-h-11 rounded-xl border border-line px-3 py-2 text-sm">
                      Править
                    </Link>
                    <DeleteEntryButton entryId={entry.id} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
