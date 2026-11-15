import { timezone } from "@/config/game";
import { formatDateInTimeZone } from "@/lib/game/dates";

export function appToday(now: Date = new Date()): string {
  return formatDateInTimeZone(now, timezone);
}
