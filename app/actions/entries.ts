"use server";

import {
  deleteTodayEntry,
  updateTodayEntry,
  upsertEntry,
} from "@/lib/server/queries";
import type { EntryMutationResult } from "@/lib/server/progress-service";
import { describeError } from "@/lib/log";
import { InputError } from "@/lib/server/validation";

export type MutationState =
  | { ok: true; data: EntryMutationResult }
  | { ok: false; error: string };

function failure(error: unknown): { ok: false; error: string } {
  if (isRedirect(error)) throw error;
  if (error instanceof InputError) return { ok: false, error: error.message };
  console.error("[entries] failed", describeError(error));
  const message = error instanceof Error ? error.message : String(error);
  return { ok: false, error: `Не удалось сохранить занятие. ${message}` };
}

function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function upsertEntryAction(
  _prev: MutationState,
  formData: FormData,
): Promise<MutationState> {
  try {
    const data = await upsertEntry({
      subject: formData.get("subject"),
      countA: formData.get("countA"),
      countB: formData.get("countB"),
      countC: formData.get("countC"),
    });
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function updateTodayEntryAction(input: {
  entryId: string;
  countA: number;
  countB: number;
  countC: number;
}): Promise<MutationState> {
  try {
    const data = await updateTodayEntry(input);
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteTodayEntryAction(
  entryId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await deleteTodayEntry(entryId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
