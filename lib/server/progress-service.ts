import { entryXp } from "@/config/game";
import { buildSnapshot, newlyUnlockedIds } from "@/lib/game/progress";
import type { GameEntry, ProgressSnapshot } from "@/lib/game/types";
import { assertEntryDateIsToday, InputError, parseCounts, parseSubject } from "@/lib/server/validation";
import type { ProgressStore, StoredAchievement, StoredEntry } from "@/lib/server/store";

export type PublicEntry = {
  id: string;
  subject: GameEntry["subject"];
  date: string;
  countA: number;
  countB: number;
  countC: number;
  xp: number;
};

export type StoredProgressSnapshot = ProgressSnapshot & {
  unlockedAchievementIds: string[];
};

export type EntryMutationResult = {
  entry: PublicEntry;
  before: StoredProgressSnapshot;
  after: StoredProgressSnapshot;
  newlyUnlocked: string[];
};

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

function withUnlocked(
  snapshot: ProgressSnapshot,
  rows: readonly StoredAchievement[],
): StoredProgressSnapshot {
  return {
    ...snapshot,
    unlockedAchievementIds: rows.map((row) => row.achievementId),
  };
}

async function awardAndSnapshot(
  store: ProgressStore,
  userId: string,
  today: string,
  beforeEntries: readonly StoredEntry[],
  beforeAchievements: readonly StoredAchievement[],
  now: string,
): Promise<Omit<EntryMutationResult, "entry">> {
  const afterEntries = await store.listEntries(userId);
  const afterBase = buildSnapshot(afterEntries.map(toGame), today);
  const newlyUnlocked = newlyUnlockedIds(
    beforeAchievements.map((row) => row.achievementId),
    afterBase.satisfiedAchievementIds,
  );
  if (newlyUnlocked.length > 0) {
    await store.insertAchievements(userId, newlyUnlocked, now);
  }
  const afterAchievements = await store.listAchievements(userId);
  return {
    before: withUnlocked(buildSnapshot(beforeEntries.map(toGame), today), beforeAchievements),
    after: withUnlocked(afterBase, afterAchievements),
    newlyUnlocked,
  };
}

export async function upsertEntryForUser(
  store: ProgressStore,
  userId: string,
  input: { subject: unknown; countA: unknown; countB: unknown; countC: unknown },
  today: string,
  now = new Date().toISOString(),
): Promise<EntryMutationResult> {
  const subject = parseSubject(input.subject);
  const counts = parseCounts(input.countA, input.countB, input.countC);
  const beforeEntries = await store.listEntries(userId);
  const beforeAchievements = await store.listAchievements(userId);
  const entry = await store.upsertEntry({ userId, subject, date: today, ...counts }, now);
  const progress = await awardAndSnapshot(store, userId, today, beforeEntries, beforeAchievements, now);
  return { entry: toPublic(entry), ...progress };
}

export async function updateTodayEntryForUser(
  store: ProgressStore,
  userId: string,
  input: { entryId: string; countA: unknown; countB: unknown; countC: unknown },
  today: string,
  now = new Date().toISOString(),
): Promise<EntryMutationResult> {
  const counts = parseCounts(input.countA, input.countB, input.countC);
  const existing = await store.getEntry(userId, input.entryId);
  if (!existing) throw new InputError("Запись не найдена");
  assertEntryDateIsToday(existing.date, today);
  const beforeEntries = await store.listEntries(userId);
  const beforeAchievements = await store.listAchievements(userId);
  const entry = await store.updateEntry(userId, input.entryId, counts, today, now);
  if (!entry) throw new InputError("Запись не найдена");
  const progress = await awardAndSnapshot(store, userId, today, beforeEntries, beforeAchievements, now);
  return { entry: toPublic(entry), ...progress };
}

export async function deleteTodayEntryForUser(
  store: ProgressStore,
  userId: string,
  entryId: string,
  today: string,
): Promise<void> {
  const existing = await store.getEntry(userId, entryId);
  if (!existing) throw new InputError("Запись не найдена");
  assertEntryDateIsToday(existing.date, today);
  const deleted = await store.deleteEntry(userId, entryId, today);
  if (!deleted) throw new InputError("Запись не найдена");
}
