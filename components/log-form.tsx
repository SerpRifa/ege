"use client";

import { upsertEntryAction, type MutationState } from "@/app/actions/entries";
import { entryXp, isSubjectId, subjects } from "@/config/game";
import { stashReward } from "@/components/reward-ceremony";
import type { PublicEntry } from "@/lib/server/progress-service";
import type { SubjectId } from "@/lib/game/types";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

const idle: MutationState = { ok: false, error: "" };

export function LogForm({
  serverPreferred,
  todayEntries,
}: {
  serverPreferred: SubjectId | null;
  todayEntries: PublicEntry[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(upsertEntryAction, idle);
  const [subject, setSubject] = useState<SubjectId>(serverPreferred ?? "informatics");
  const initial = todayEntries.find((entry) => entry.subject === (serverPreferred ?? "informatics"));
  const [countA, setCountA] = useState(initial?.countA ?? 0);
  const [countB, setCountB] = useState(initial?.countB ?? 0);
  const [countC, setCountC] = useState(initial?.countC ?? 0);

  function applySubject(next: SubjectId) {
    const existing = todayEntries.find((entry) => entry.subject === next);
    setSubject(next);
    setCountA(existing?.countA ?? 0);
    setCountB(existing?.countB ?? 0);
    setCountC(existing?.countC ?? 0);
  }

  const entriesRef = useRef(todayEntries);
  useEffect(() => {
    if (serverPreferred) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("ege-last-subject");
    } catch {
      return;
    }
    if (!saved || !isSubjectId(saved)) return;
    const existing = entriesRef.current.find((entry) => entry.subject === saved);
    setSubject(saved);
    setCountA(existing?.countA ?? 0);
    setCountB(existing?.countB ?? 0);
    setCountC(existing?.countC ?? 0);
  }, [serverPreferred]);

  useEffect(() => {
    if (!state.ok) return;
    try {
      localStorage.setItem("ege-last-subject", subject);
    } catch {
      // необязательная память выбора
    }
    stashReward({
      before: state.data.before,
      after: state.data.after,
      newlyUnlocked: state.data.newlyUnlocked,
    });
    router.push("/");
  }, [state, router, subject]);

  const existing = todayEntries.find((entry) => entry.subject === subject);
  const xp = entryXp({ countA, countB, countC });
  const ready = countA + countB + countC > 0;

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="subject" value={subject} />
      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="mb-2 text-sm text-muted">Предмет</legend>
        {subjects.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`min-h-16 rounded-2xl border px-2 py-3 text-sm ${subject === item.id ? "border-gold bg-gold text-ink" : "border-line bg-panel"}`}
            onClick={() => applySubject(item.id)}
            aria-pressed={subject === item.id}
          >
            {item.id === "math" ? "Математика" : item.title}
          </button>
        ))}
      </fieldset>

      {existing ? (
        <p className="rounded-2xl bg-panel-2 px-3 py-2 text-sm text-muted">
          За сегодня уже есть запись: A {existing.countA}, B {existing.countB}, C {existing.countC}. Сохранение обновит её.
        </p>
      ) : null}

      <Stepper label="Задания A" hint="1 XP" name="countA" value={countA} onChange={setCountA} />
      <Stepper label="Задания B" hint="10 XP" name="countB" value={countB} onChange={setCountB} />
      <Stepper label="Задания C" hint="50 XP" name="countC" value={countC} onChange={setCountC} />

      <p className="font-display text-3xl text-gold">
        {xp} XP
        {existing ? <span className="ml-2 text-base text-muted">вместо {existing.xp}</span> : null}
      </p>

      {!state.ok && state.error ? (
        <p role="alert" className="text-danger">
          {state.error}
        </p>
      ) : null}
      {!ready ? <p className="text-sm text-muted">Нужно хотя бы одно задание.</p> : null}

      <button
        type="submit"
        disabled={pending || !ready}
        className="min-h-14 rounded-2xl bg-gold text-lg font-semibold text-ink disabled:opacity-50"
      >
        {pending ? "Сохраняем…" : existing ? "Обновить" : "Записать занятие"}
      </button>
    </form>
  );
}

function Stepper({
  label,
  hint,
  name,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={name} className="font-medium">
          {label}
        </label>
        <span className="text-sm text-muted">{hint}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="h-14 w-14 rounded-2xl bg-panel-2 text-2xl"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Меньше: ${label}`}
        >
          −
        </button>
        <input
          id={name}
          name={name}
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(event) => {
            const raw = event.target.value.trim();
            if (raw === "") {
              onChange(0);
              return;
            }
            if (/^\d+$/.test(raw)) onChange(Number(raw));
          }}
          className="h-14 w-full rounded-2xl border border-line bg-ink text-center text-2xl"
        />
        <button
          type="button"
          className="h-14 w-14 rounded-2xl bg-panel-2 text-2xl"
          onClick={() => onChange(value + 1)}
          aria-label={`Больше: ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
