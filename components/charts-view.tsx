"use client";

import { subjectTitle } from "@/config/game";
import type { CalendarDay, ChartsData } from "@/lib/game/charts";
import { formatRuDate } from "@/lib/ui/format";
import Link from "next/link";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const subjectColor = {
  informatics: "#3ecbff",
  math: "#c4b5fd",
  russian: "#ff8f6b",
} as const;

const weekdayHeads = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export function ChartsView({ charts, today }: { charts: ChartsData; today: string }) {
  const total = charts.bySubject.reduce((sum, item) => sum + item.xp, 0);
  const weeks = charts.weeks.map((week) => ({
    ...week,
    label: formatRuDate(week.weekStart).replace(/\s?\d{4}.*$/, ""),
  }));
  const weeksOfDays: CalendarDay[][] = [];
  for (let index = 0; index < charts.calendar.length; index += 7) {
    weeksOfDays.push(charts.calendar.slice(index, index + 7));
  }

  return (
    <div className="grid gap-4">
      {total === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-panel px-4 py-8 text-center">
          <p className="text-lg">Пока нет данных — запиши первое занятие</p>
          <Link href="/log" className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-gold px-4 font-semibold text-ink">
            Записать занятие
          </Link>
        </div>
      ) : (
        <>
          <section className="rounded-3xl bg-panel p-4">
            <h2 className="mb-3 font-display text-xl">XP по неделям</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeks}>
                  <XAxis dataKey="label" stroke="#aeb6c9" fontSize={12} />
                  <YAxis stroke="#aeb6c9" fontSize={12} width={36} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="informatics" stackId="xp" fill={subjectColor.informatics} name="Информатика" />
                  <Bar dataKey="math" stackId="xp" fill={subjectColor.math} name="Математика" />
                  <Bar dataKey="russian" stackId="xp" fill={subjectColor.russian} name="Русский" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="rounded-3xl bg-panel p-4">
            <h2 className="mb-3 font-display text-xl">По предметам</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.bySubject} dataKey="xp" nameKey="subject" innerRadius={48} outerRadius={80}>
                    {charts.bySubject.map((item) => (
                      <Cell key={item.subject} fill={subjectColor[item.subject]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, _name, item) => {
                      const subject = item?.payload && typeof item.payload === "object" && "subject" in item.payload
                        ? String(item.payload.subject)
                        : "";
                      const title = subject === "informatics" || subject === "math" || subject === "russian"
                        ? subjectTitle(subject)
                        : "XP";
                      return [`${value ?? 0} XP`, title];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="rounded-3xl bg-panel p-4">
            <h2 className="mb-3 font-display text-xl">Вклад A / B / C</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.byCategory}>
                  <XAxis dataKey="category" stroke="#aeb6c9" />
                  <YAxis stroke="#aeb6c9" width={36} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value ?? 0} XP`, "Вклад"]} />
                  <Bar dataKey="xp" fill="#f0b429" name="XP" radius={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      <section className="rounded-3xl bg-panel p-4">
        <h2 className="mb-1 font-display text-xl">Календарь занятий</h2>
        <p className="mb-3 text-sm text-muted">Обязательный слот: выполнен, пропущен или ещё впереди. Точка — дополнительное занятие.</p>
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-muted">
          {weekdayHeads.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid gap-1">
          {weeksOfDays.map((week) => (
            <div key={week[0]?.date ?? "week"} className="grid grid-cols-7 gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`relative min-h-14 rounded-xl border px-1 py-1 text-center text-xs ${dayClass(day)} ${day.date === today ? "ring-2 ring-cream" : ""}`}
                >
                  <div>{Number(day.date.slice(8))}</div>
                  <div className="text-[10px] leading-tight">{dayLabel(day)}</div>
                  {day.hasExtra ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-gold" aria-label="доп" /> : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const tooltipStyle = {
  background: "#1a2133",
  border: "1px solid #36425f",
  borderRadius: 12,
  color: "#f6f1e7",
};

function dayClass(day: CalendarDay): string {
  if (day.requiredState === "done") return "border-mint/50 bg-mint/15";
  if (day.requiredState === "missed") return "border-danger/40 bg-danger/10";
  if (day.requiredState === "pending") return "border-dashed border-line";
  return "border-transparent bg-white/5";
}

function dayLabel(day: CalendarDay): string {
  if (day.requiredState === "done") return "ок";
  if (day.requiredState === "missed") return "пропуск";
  if (day.requiredState === "pending") return "ждёт";
  if (day.hasExtra) return "доп";
  return "";
}
