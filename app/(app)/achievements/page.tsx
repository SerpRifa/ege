import { getAchievements } from "@/lib/server/queries";
import { formatRuDateTime } from "@/lib/ui/format";

export default async function AchievementsPage() {
  const items = await getAchievements();

  return (
    <div className="grid gap-4">
      <h1 className="font-display text-3xl">Ачивки</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`rounded-3xl border p-4 ${item.unlocked ? "border-gold bg-panel" : "border-line bg-ink/40 text-muted"}`}
          >
            <p className="font-display text-xl text-cream">{item.title}</p>
            <p className="mt-2 text-sm">{item.description}</p>
            <p className="mt-3 text-sm">{item.unlocked && item.unlockedAt ? formatRuDateTime(item.unlockedAt) : "Ещё закрыта"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
