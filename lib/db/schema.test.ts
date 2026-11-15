import { getTableColumns } from "drizzle-orm";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { entries, userAchievements, users } from "@/lib/db/schema";
import { describe, expect, it } from "vitest";

describe("схема прогресса", () => {
  it("не хранит вычисляемые очки, уровень, статус и серию", () => {
    expect(Object.keys(getTableColumns(users)).sort()).toEqual(
      ["createdAt", "displayName", "id", "login", "passwordHash"].sort(),
    );
    expect(Object.keys(getTableColumns(entries)).sort()).toEqual(
      ["countA", "countB", "countC", "createdAt", "date", "id", "subject", "updatedAt", "userId"].sort(),
    );
    expect(Object.keys(getTableColumns(userAchievements)).sort()).toEqual(
      ["achievementId", "id", "unlockedAt", "userId"].sort(),
    );
  });

  it("миграция создаёт три таблицы и уникальные ключи", () => {
    const migrationDir = path.resolve(process.cwd(), "drizzle");
    const sqlFile = readdirSync(migrationDir).find((name) => name.endsWith(".sql"));
    expect(sqlFile).toBeTruthy();
    const sql = readFileSync(path.join(migrationDir, sqlFile ?? ""), "utf8");
    expect(sql).toContain('CREATE TABLE "users"');
    expect(sql).toContain('CREATE TABLE "entries"');
    expect(sql).toContain('CREATE TABLE "user_achievements"');
    expect(sql).toContain("entries_user_subject_date_unique");
    expect(sql).toContain("user_achievements_user_achievement_unique");
    expect(sql.toLowerCase()).not.toContain("streak");
    expect(sql.toLowerCase()).not.toContain("total_xp");
  });
});
