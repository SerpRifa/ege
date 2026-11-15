import { achievements, entryXp, subjectTitle } from "@/config/game";
import { appToday } from "@/lib/game/clock";
import { buildCharts } from "@/lib/game/charts";
import { buildSnapshot, statusLadder } from "@/lib/game/progress";
import { todayObligation } from "@/lib/game/schedule";
import type { GameEntry, SubjectId } from "@/lib/game/types";
import { requireUser } from "@/lib/auth/current";
import { getDb } from "@/lib/db/client";
import { createDrizzleProgressStore } from "@/lib/server/drizzle-store";
import {
  deleteTodayEntryForUser,
  updateTodayEntryForUser,
  upsertEntryForUser,
  type EntryMutationResult,
  type PublicEntry,
  type StoredProgressSnapshot,
} from "@/lib/server/progress-service";
import type { StoredEntry } from "@/lib/server/store";
import { parseSubject } from "@/lib/server/validation";

function store() {
  return createDrizzleProgressStore(getDb());
}

function toGame(entry: StoredEntry): GameEntry {
  return {
    subject: entry.subject,
    date: entry.date,
    countA: entry.countA,
    countB: entry.countB,
    countC: entry.countC,
  };
}

function toPublic(entry: StoredEntry): PublicEntry {
  return {
    id: entry.id,
    subject: entry.subject,
    date: entry.date,
    countA: entry.countA,
    countB: entry.countB,
    countC: entry.countC,
    xp: entryXp(entry),
  };
}

export async function getDashboard() {
  const user = await requireUser();
  const today = appToday();
  const progress = store();
  const entries = await progress.listEntries(user.id);
  const unlocked = await progress.listAchievements(user.id);
  const gameEntries = entries.map(toGame);
  const snapshot: StoredProgressSnapshot = {
    ...buildSnapshot(gameEntries, today),
    unlockedAchievementIds: unlocked.map((row) => row.achievementId),
  };
  return {
    user,
    today,
    snapshot,
    todaySlot: todayObligation(gameEntries, today),
    recentEntries: entries.slice(0, 8).map(toPublic),
    todayEntries: entries.filter((entry) => entry.date === today).map(toPublic),
  };
}

export async function getSubject(subjectValue: string) {
  const user = await requireUser();
  const subject = parseSubject(subjectValue);
  const today = appToday();
  const entries = (await store().listEntries(user.id)).filter((entry) => entry.subject === subject);
  const snapshot = buildSnapshot(entries.map(toGame), today);
  return {
    subject,
    title: subjectTitle(subject),
    today,
    progress: snapshot.subjects[subject],
    ladder: statusLadder(subject, snapshot.subjects[subject].level),
    entries: entries.map(toPublic),
  };
}

export async function getAchievements() {
  const user = await requireUser();
  const rows = await store().listAchievements(user.id);
  const unlockedAt = new Map(rows.map((row) => [row.achievementId, row.unlockedAt]));
  return achievements.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    unlocked: unlockedAt.has(item.id),
    unlockedAt: unlockedAt.get(item.id) ?? null,
  }));
}

export async function getCharts() {
  const user = await requireUser();
  const today = appToday();
  const entries = await store().listEntries(user.id);
  return { today, charts: buildCharts(entries.map(toGame), today) };
}

export async function upsertEntry(input: {
  subject: unknown;
  countA: unknown;
  countB: unknown;
  countC: unknown;
}): Promise<EntryMutationResult> {
  const user = await requireUser();
  return upsertEntryForUser(store(), user.id, input, appToday());
}

export async function updateTodayEntry(input: {
  entryId: string;
  countA: unknown;
  countB: unknown;
  countC: unknown;
}): Promise<EntryMutationResult> {
  const user = await requireUser();
  return updateTodayEntryForUser(store(), user.id, input, appToday());
}

export async function deleteTodayEntry(entryId: string): Promise<void> {
  const user = await requireUser();
  await deleteTodayEntryForUser(store(), user.id, entryId, appToday());
}

export type { SubjectId };
