"use client";

import { deleteTodayEntryAction } from "@/app/actions/entries";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="grid gap-1">
      <button
        type="button"
        disabled={pending}
        className="min-h-11 rounded-xl border border-danger/50 px-3 text-sm text-danger disabled:opacity-50"
        onClick={() => {
          if (!window.confirm("Удалить сегодняшнее занятие?")) return;
          setPending(true);
          setError("");
          void deleteTodayEntryAction(entryId).then((result) => {
            if (!result.ok) {
              setError(result.error);
              setPending(false);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Удаляем…" : "Удалить"}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
