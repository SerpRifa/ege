import { and, desc, eq } from "drizzle-orm";
import { isSubjectId } from "@/config/game";
import type { Database } from "@/lib/db/client";
import { entries, userAchievements } from "@/lib/db/schema";
import type { SubjectId } from "@/lib/game/types";
import type { Counts, EntryDraft, ProgressStore, StoredAchievement, StoredEntry } from "@/lib/server/store";

function asSubject(value: string): SubjectId {
  if (!isSubjectId(value)) throw new Error("Некорректный предмет в базе");
  return value;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapEntry(row: typeof entries.$inferSelect): StoredEntry {
  return {
    id: row.id,
    userId: row.userId,
    subject: asSubject(row.subject),
    date: row.date,
    countA: row.countA,
    countB: row.countB,
    countC: row.countC,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapAchievement(row: typeof userAchievements.$inferSelect): StoredAchievement {
  return {
    id: row.id,
    userId: row.userId,
    achievementId: row.achievementId,
    unlockedAt: toIso(row.unlockedAt),
  };
}

export function createDrizzleProgressStore(db: Database): ProgressStore {
  return {
    async listEntries(userId) {
      const rows = await db
        .select()
        .from(entries)
        .where(eq(entries.userId, userId))
        .orderBy(desc(entries.date), desc(entries.createdAt));
      return rows.map(mapEntry);
    },
    async getEntry(userId, entryId) {
      const rows = await db
        .select()
        .from(entries)
        .where(and(eq(entries.userId, userId), eq(entries.id, entryId)))
        .limit(1);
      const row = rows[0];
      return row ? mapEntry(row) : null;
    },
    async upsertEntry(draft: EntryDraft, now: string) {
      const timestamp = new Date(now);
      const rows = await db
        .insert(entries)
        .values({
          id: crypto.randomUUID(),
          userId: draft.userId,
          subject: draft.subject,
          date: draft.date,
          countA: draft.countA,
          countB: draft.countB,
          countC: draft.countC,
          updatedAt: timestamp,
        })
        .onConflictDoUpdate({
          target: [entries.userId, entries.subject, entries.date],
          set: {
            countA: draft.countA,
            countB: draft.countB,
            countC: draft.countC,
            updatedAt: timestamp,
          },
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("Не удалось сохранить занятие");
      return mapEntry(row);
    },
    async updateEntry(userId, entryId, counts: Counts, date, now) {
      const rows = await db
        .update(entries)
        .set({
          countA: counts.countA,
          countB: counts.countB,
          countC: counts.countC,
          updatedAt: new Date(now),
        })
        .where(and(eq(entries.userId, userId), eq(entries.id, entryId), eq(entries.date, date)))
        .returning();
      const row = rows[0];
      return row ? mapEntry(row) : null;
    },
    async deleteEntry(userId, entryId, date) {
      const rows = await db
        .delete(entries)
        .where(and(eq(entries.userId, userId), eq(entries.id, entryId), eq(entries.date, date)))
        .returning({ id: entries.id });
      return rows.length > 0;
    },
    async listAchievements(userId) {
      const rows = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));
      return rows.map(mapAchievement);
    },
    async insertAchievements(userId, achievementIds, now) {
      if (achievementIds.length === 0) return;
      await db
        .insert(userAchievements)
        .values(
          achievementIds.map((achievementId) => ({
            id: crypto.randomUUID(),
            userId,
            achievementId,
            unlockedAt: new Date(now),
          })),
        )
        .onConflictDoNothing({
          target: [userAchievements.userId, userAchievements.achievementId],
        });
    },
  };
}
