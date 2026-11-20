import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";
import { databaseTarget } from "@/lib/log";

export type Database = PostgresJsDatabase<typeof schema>;

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as typeof globalThis & {
  __studySql?: Sql;
  __studyDb?: Database;
  __studyUrl?: string;
};

export function getDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[db] DATABASE_URL is not set");
    throw new Error("DATABASE_URL is not set");
  }
  if (globalForDb.__studyDb && globalForDb.__studyUrl === url) {
    return globalForDb.__studyDb;
  }
  if (globalForDb.__studySql) {
    void globalForDb.__studySql.end({ timeout: 1 });
  }
  console.info("[db] opening connection", {
    target: databaseTarget(),
    sessionSecret: process.env.SESSION_SECRET ? "set" : "missing",
    ssl: "require",
    prepare: false,
  });
  const sql = postgres(url, {
    max: 1,
    prepare: false,
    ssl: "require",
    connect_timeout: 15,
  });
  const db = drizzle(sql, { schema });
  globalForDb.__studySql = sql;
  globalForDb.__studyDb = db;
  globalForDb.__studyUrl = url;
  return db;
}

export async function closeDb(): Promise<void> {
  const sql = globalForDb.__studySql;
  globalForDb.__studySql = undefined;
  globalForDb.__studyDb = undefined;
  globalForDb.__studyUrl = undefined;
  if (sql) {
    await sql.end({ timeout: 5 });
  }
}
