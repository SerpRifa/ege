import { isSubjectId } from "@/config/game";
import type { SubjectId } from "@/lib/game/types";

export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

export function parseCount(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) return null;
    return value;
  }
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value.trim());
  if (!Number.isSafeInteger(parsed) || parsed < 0) return null;
  return parsed;
}

export function parseCounts(countA: unknown, countB: unknown, countC: unknown): {
  countA: number;
  countB: number;
  countC: number;
} {
  const parsedA = parseCount(countA);
  const parsedB = parseCount(countB);
  const parsedC = parseCount(countC);
  if (parsedA === null || parsedB === null || parsedC === null) {
    throw new InputError("Количество заданий должно быть целым числом от 0");
  }
  if (parsedA + parsedB + parsedC < 1) {
    throw new InputError("Нужно хотя бы одно задание");
  }
  return { countA: parsedA, countB: parsedB, countC: parsedC };
}

export function parseSubject(value: unknown): SubjectId {
  if (typeof value !== "string" || !isSubjectId(value)) {
    throw new InputError("Неизвестный предмет");
  }
  return value;
}

export function assertEntryDateIsToday(date: string, today: string): void {
  if (date !== today) {
    throw new InputError("Менять записи можно только за сегодня");
  }
}
