import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  login: text("login").notNull().unique("users_login_unique"),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entries = pgTable(
  "entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    date: date("date").notNull(),
    countA: integer("count_a").notNull(),
    countB: integer("count_b").notNull(),
    countC: integer("count_c").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("entries_user_subject_date_unique").on(table.userId, table.subject, table.date),
    index("entries_user_date_idx").on(table.userId, table.date),
    check(
      "entries_counts_non_negative",
      sql`${table.countA} >= 0 AND ${table.countB} >= 0 AND ${table.countC} >= 0`,
    ),
    check("entries_at_least_one", sql`${table.countA} + ${table.countB} + ${table.countC} >= 1`),
    check(
      "entries_subject_known",
      sql`${table.subject} IN ('informatics', 'math', 'russian')`,
    ),
  ],
);

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_achievements_user_achievement_unique").on(table.userId, table.achievementId),
  ],
);
