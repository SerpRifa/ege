import { createMemoryStore } from "@/lib/server/memory-store";
import {
  deleteTodayEntryForUser,
  updateTodayEntryForUser,
  upsertEntryForUser,
} from "@/lib/server/progress-service";
import { describe, expect, it } from "vitest";

const today = "2026-11-15";
const now = "2026-11-15T12:00:00.000Z";

describe("операции прогресса", () => {
  it("обновляет сегодняшнюю запись того же предмета и не смешивает пользователей", async () => {
    const store = createMemoryStore();
    const first = await upsertEntryForUser(
      store,
      "user-a",
      { subject: "math", countA: 1, countB: 0, countC: 0 },
      today,
      now,
    );
    const second = await upsertEntryForUser(
      store,
      "user-a",
      { subject: "math", countA: 4, countB: 1, countC: 0 },
      today,
      now,
    );
    await upsertEntryForUser(
      store,
      "user-b",
      { subject: "russian", countA: 2, countB: 0, countC: 0 },
      today,
      now,
    );

    const own = await store.listEntries("user-a");
    const other = await store.listEntries("user-b");
    expect(own).toHaveLength(1);
    expect(own[0]?.countA).toBe(4);
    expect(own[0]?.countB).toBe(1);
    expect(own[0]?.id).toBe(first.entry.id);
    expect(second.entry.xp).toBe(14);
    expect(other).toHaveLength(1);
    expect(other[0]?.subject).toBe("russian");
    expect(await store.getEntry("user-b", first.entry.id)).toBeNull();
  });

  it("отклоняет правку и удаление чужой или несегодняшней записи", async () => {
    const store = createMemoryStore();
    const created = await store.upsertEntry(
      { userId: "user-a", subject: "informatics", date: "2026-11-14", countA: 1, countB: 0, countC: 0 },
      now,
    );

    await expect(
      updateTodayEntryForUser(
        store,
        "user-a",
        { entryId: created.id, countA: 2, countB: 0, countC: 0 },
        today,
        now,
      ),
    ).rejects.toThrow(/только за сегодня/);
    await expect(deleteTodayEntryForUser(store, "user-b", created.id, "2026-11-14")).rejects.toThrow(
      /не найдена/,
    );
    expect(await store.getEntry("user-a", created.id)).not.toBeNull();
  });

  it("выдаёт новые ачивки один раз и не отзывает их", async () => {
    const store = createMemoryStore();
    const first = await upsertEntryForUser(
      store,
      "user-a",
      { subject: "math", countA: 0, countB: 0, countC: 1 },
      today,
      now,
    );
    expect(first.newlyUnlocked).toEqual(expect.arrayContaining(["first_session", "first_c", "extra_session"]));

    const second = await upsertEntryForUser(
      store,
      "user-a",
      { subject: "math", countA: 1, countB: 0, countC: 0 },
      today,
      now,
    );
    expect(second.newlyUnlocked).toEqual([]);
    expect(second.after.unlockedAchievementIds).toEqual(
      expect.arrayContaining(["first_session", "first_c", "extra_session"]),
    );

    const rows = await store.listAchievements("user-a");
    expect(rows.filter((row) => row.achievementId === "first_c")).toHaveLength(1);
    expect(await store.listAchievements("user-b")).toEqual([]);

    await deleteTodayEntryForUser(store, "user-a", second.entry.id, today);
    expect((await store.listAchievements("user-a")).map((row) => row.achievementId)).toEqual(
      expect.arrayContaining(["first_c"]),
    );
    expect(await store.listEntries("user-a")).toEqual([]);
  });
});
