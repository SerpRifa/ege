export function XpBar({
  progress,
  label,
  animate = false,
}: {
  progress: number;
  label: string;
  animate?: boolean;
}) {
  const width = `${Math.max(0, Math.min(100, progress * 100))}%`;
  return (
    <div className="grid gap-1">
      <div className="flex justify-between text-sm text-muted">
        <span>{label}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label={label}>
        <div
          className="h-full rounded-full bg-gold"
          style={{ width, transition: animate ? "width 600ms ease" : undefined }}
        />
      </div>
    </div>
  );
}
