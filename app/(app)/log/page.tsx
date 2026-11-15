import { isSubjectId } from "@/config/game";
import { LogForm } from "@/components/log-form";
import { getDashboard } from "@/lib/server/queries";

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = Array.isArray(params.subject) ? params.subject[0] : params.subject;
  const data = await getDashboard();
  const serverPreferred =
    requested && isSubjectId(requested) ? requested : data.todaySlot.subject;

  return (
    <div className="mx-auto grid max-w-lg gap-4">
      <h1 className="font-display text-3xl">Записать занятие</h1>
      <p className="text-muted">Только за сегодня. Повторная запись по предмету обновляет числа.</p>
      <LogForm serverPreferred={serverPreferred} todayEntries={data.todayEntries} />
    </div>
  );
}
