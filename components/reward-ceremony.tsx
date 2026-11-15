"use client";

import { achievements, statuses } from "@/config/game";
import { CharacterPortrait } from "@/components/character-portrait";
import type { StoredProgressSnapshot } from "@/lib/server/progress-service";
import type { StatusId, TrackId, TrackProgress } from "@/lib/game/types";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "pending-reward";

export type RewardPayload = {
  before: StoredProgressSnapshot;
  after: StoredProgressSnapshot;
  newlyUnlocked: string[];
};

const trackMeta: { track: TrackId; label: string; pick: (snapshot: StoredProgressSnapshot) => TrackProgress }[] = [
  { track: "overall", label: "Общий статус", pick: (snapshot) => snapshot.overall },
  { track: "informatics", label: "Информатика", pick: (snapshot) => snapshot.subjects.informatics },
  { track: "math", label: "Математика", pick: (snapshot) => snapshot.subjects.math },
  { track: "russian", label: "Русский язык", pick: (snapshot) => snapshot.subjects.russian },
];

function statusRank(statusId: StatusId): number {
  return statuses.find((status) => status.id === statusId)?.minLevel ?? 0;
}

function isPayload(value: unknown): value is RewardPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<RewardPayload>;
  return Boolean(payload.before?.overall && payload.after?.overall && Array.isArray(payload.newlyUnlocked));
}

export function stashReward(payload: RewardPayload) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Сессия могла запретить storage — данные уже сохранены на сервере.
  }
}

function sleep(ms: number, cancelled: () => boolean) {
  return new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), cancelled() ? 0 : ms);
  });
}

export function RewardHost() {
  const [payload, setPayload] = useState<RewardPayload | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (isPayload(parsed)) setPayload(parsed);
    } catch {
      setPayload(null);
    }
  }, []);

  if (!payload) return null;
  return <RewardCeremony payload={payload} onDone={() => setPayload(null)} />;
}

function RewardCeremony({ payload, onDone }: { payload: RewardPayload; onDone: () => void }) {
  const reduced = useReducedMotion();
  const xpGained = payload.after.overall.totalXp - payload.before.overall.totalXp;
  const unlocked = payload.newlyUnlocked.flatMap((id) => {
    const item = achievements.find((entry) => entry.id === id);
    return item ? [{ id: item.id, title: item.title, description: item.description }] : [];
  });

  const [level, setLevel] = useState(payload.before.overall.level);
  const [bar, setBar] = useState(payload.before.overall.progress01);
  const [portrait, setPortrait] = useState<{ track: TrackId; statusId: StatusId }>({
    track: "overall",
    statusId: payload.before.overall.statusId,
  });
  const [confetti, setConfetti] = useState(false);
  const [toastIndex, setToastIndex] = useState(-1);
  const [caption, setCaption] = useState("Опыт начислен");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (reduced === null) return;
    if (reduced) {
      if (payload.newlyUnlocked.length === 0) onDoneRef.current();
      return;
    }
    let cancelled = false;
    const isCancelled = () => cancelled;
    const sequence = trackMeta.flatMap((item) => {
      const from = item.pick(payload.before);
      const to = item.pick(payload.after);
      if (from.statusId === to.statusId) return [];
      return [
        {
          track: item.track,
          label: item.label,
          from,
          to,
          upgraded: statusRank(to.statusId) > statusRank(from.statusId),
        },
      ];
    });
    const toasts = payload.newlyUnlocked.flatMap((id) => {
      const item = achievements.find((entry) => entry.id === id);
      return item ? [item.id] : [];
    });

    async function run() {
      await sleep(450, isCancelled);
      if (payload.after.overall.level > payload.before.overall.level) {
        let current = payload.before.overall.level;
        while (current < payload.after.overall.level) {
          setBar(1);
          setCaption(`Уровень ${current}`);
          await sleep(680, isCancelled);
          current += 1;
          setLevel(current);
          setBar(0);
          setCaption(`Уровень ${current}`);
          await sleep(220, isCancelled);
        }
        setBar(payload.after.overall.progress01);
        await sleep(700, isCancelled);
      } else {
        setLevel(payload.after.overall.level);
        setBar(payload.after.overall.progress01);
        await sleep(700, isCancelled);
      }

      for (const evolution of sequence) {
        setPortrait({ track: evolution.track, statusId: evolution.from.statusId });
        setCaption(`${evolution.label}: ${evolution.from.statusTitle}`);
        await sleep(280, isCancelled);
        setPortrait({ track: evolution.track, statusId: evolution.to.statusId });
        setCaption(`${evolution.label}: ${evolution.to.statusTitle}`);
        setConfetti(evolution.upgraded);
        await sleep(900, isCancelled);
        setConfetti(false);
      }

      for (let index = 0; index < toasts.length; index += 1) {
        setToastIndex(index);
        await sleep(1200, isCancelled);
      }

      if (!cancelled) onDoneRef.current();
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [reduced, payload]);

  if (reduced === null) return null;

  const motionOff = reduced === true;
  if (motionOff && unlocked.length === 0) return null;
  const shownLevel = motionOff ? payload.after.overall.level : level;
  const shownBar = motionOff ? payload.after.overall.progress01 : bar;
  const shownPortrait = motionOff
    ? { track: "overall" as const, statusId: payload.after.overall.statusId }
    : portrait;
  const toast = toastIndex >= 0 ? unlocked[toastIndex] : undefined;

  return (
    <div className="fixed inset-0 z-40 grid content-end justify-items-center bg-ink/75 p-4 sm:content-center" role="dialog" aria-modal="true" aria-label="Награда за занятие">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-line bg-panel p-5 shadow-2xl">
        {confetti && !motionOff ? <Confetti /> : null}
        <div className="grid justify-items-center gap-3 text-center">
          <motion.div
            key={`${shownPortrait.track}-${shownPortrait.statusId}`}
            initial={motionOff ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <CharacterPortrait track={shownPortrait.track} statusId={shownPortrait.statusId} size={168} />
          </motion.div>
          <p className="font-display text-3xl text-gold">
            {xpGained >= 0 ? "+" : "−"}
            {Math.abs(xpGained)} XP
          </p>
          <p className="text-sm text-muted">{caption}</p>
          <motion.p
            key={shownLevel}
            className="font-display text-4xl"
            initial={motionOff ? false : { scale: 0.82 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 16 }}
          >
            {shownLevel}
          </motion.p>
          <div className="w-full text-left">
            <XpLine progress={shownBar} animate={!motionOff} />
          </div>
        </div>
        {reduced && unlocked.length > 0 ? (
          <ul className="mt-4 grid gap-2">
            {unlocked.map((item) => (
              <li key={item.id} className="rounded-2xl bg-panel-2 px-3 py-2 text-left">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted">{item.description}</p>
              </li>
            ))}
          </ul>
        ) : null}
        {toast && !motionOff ? (
          <div className="mt-4 rounded-2xl bg-gold px-3 py-3 text-left text-ink" aria-live="polite">
            <p className="text-xs uppercase tracking-wide">Ачивка</p>
            <p className="font-display text-lg">{toast.title}</p>
            <p className="text-sm">{toast.description}</p>
          </div>
        ) : null}
        <button type="button" className="mt-4 w-full rounded-2xl bg-cream px-4 py-3 font-medium text-ink" onClick={onDone}>
          Продолжить
        </button>
      </div>
    </div>
  );
}

function XpLine({ progress, animate }: { progress: number; animate: boolean }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gold"
        style={{
          width: `${Math.max(0, Math.min(100, progress * 100))}%`,
          transition: animate ? "width 600ms ease" : "none",
        }}
      />
    </div>
  );
}

function Confetti() {
  const pieces = ["#f0b429", "#3ddec0", "#ff8f6b", "#c4b5fd", "#3ecbff"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((color, index) => (
        <motion.span
          key={color}
          className="absolute h-2 w-2 rounded-full"
          style={{ background: color, left: `${12 + index * 16}%`, top: "18%" }}
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 120, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
