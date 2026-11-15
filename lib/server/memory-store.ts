import type { Counts, EntryDraft, ProgressStore, StoredAchievement, StoredEntry } from "@/lib/server/store";

function copyEntry(entry: StoredEntry): StoredEntry {
  return { ...entry };
}

export function createMemoryStore(): ProgressStore {
  const entries: StoredEntry[] = [];
  const achievements: StoredAchievement[] = [];

  return {
    async listEntries(userId) {
      return entries
        .filter((entry) => entry.userId === userId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .map(copyEntry);
    },
    async getEntry(userId, entryId) {
      const found = entries.find((entry) => entry.userId === userId && entry.id === entryId);
      return found ? copyEntry(found) : null;
    },
    async upsertEntry(draft: EntryDraft, now: string) {
      const existing = entries.find(
        (entry) =>
          entry.userId === draft.userId && entry.subject === draft.subject && entry.date === draft.date,
      );
      if (existing) {
        existing.countA = draft.countA;
        existing.countB = draft.countB;
        existing.countC = draft.countC;
        existing.updatedAt = now;
        return copyEntry(existing);
      }
      const created: StoredEntry = {
        id: crypto.randomUUID(),
        userId: draft.userId,
        subject: draft.subject,
        date: draft.date,
        countA: draft.countA,
        countB: draft.countB,
        countC: draft.countC,
        createdAt: now,
        updatedAt: now,
      };
      entries.push(created);
      return copyEntry(created);
    },
    async updateEntry(userId, entryId, counts: Counts, date, now) {
      const existing = entries.find(
        (entry) => entry.userId === userId && entry.id === entryId && entry.date === date,
      );
      if (!existing) return null;
      existing.countA = counts.countA;
      existing.countB = counts.countB;
      existing.countC = counts.countC;
      existing.updatedAt = now;
      return copyEntry(existing);
    },
    async deleteEntry(userId, entryId, date) {
      const index = entries.findIndex(
        (entry) => entry.userId === userId && entry.id === entryId && entry.date === date,
      );
      if (index < 0) return false;
      entries.splice(index, 1);
      return true;
    },
    async listAchievements(userId) {
      return achievements
        .filter((row) => row.userId === userId)
        .map((row) => ({ ...row }));
    },
    async insertAchievements(userId, achievementIds, now) {
      for (const achievementId of achievementIds) {
        const exists = achievements.some(
          (row) => row.userId === userId && row.achievementId === achievementId,
        );
        if (exists) continue;
        achievements.push({
          id: crypto.randomUUID(),
          userId,
          achievementId,
          unlockedAt: now,
        });
      }
    },
  };
}
