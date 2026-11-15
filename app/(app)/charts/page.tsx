import { ChartsView } from "@/components/charts-view";
import { getCharts } from "@/lib/server/queries";

export default async function ChartsPage() {
  const data = await getCharts();
  return (
    <div className="grid gap-4">
      <h1 className="font-display text-3xl">Графики</h1>
      <ChartsView charts={data.charts} today={data.today} />
    </div>
  );
}
