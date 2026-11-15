import type { SubjectId } from "@/lib/game/types";

export type Counts = {
  countA: number;
  countB: number;
  countC: number;
};

export type StoredEntry = Counts & {
  id: string;
  userId: string;
  subject: SubjectId;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredAchievement = {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
};

export type EntryDraft = Counts & {
  userId: string;
  subject: SubjectId;
  date: string;
};

export interface ProgressStore {
  listEntries(userId: string): Promise<StoredEntry[]>;
  getEntry(userId: string, entryId: string): Promise<StoredEntry | null>;
  upsertEntry(draft: EntryDraft, now: string): Promise<StoredEntry>;
  updateEntry(userId: string, entryId: string, counts: Counts, date: string, now: string): Promise<StoredEntry | null>;
  deleteEntry(userId: string, entryId: string, date: string): Promise<boolean>;
  listAchievements(userId: string): Promise<StoredAchievement[]>;
  insertAchievements(userId: string, achievementIds: readonly string[], now: string): Promise<void>;
}
