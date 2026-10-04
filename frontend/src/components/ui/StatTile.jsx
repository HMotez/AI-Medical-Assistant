import CountUp from "./CountUp";

/**
 * KPI tile (stat tile): label · value · optional meter · optional context line.
 * The value uses the body sans, semibold, with proportional figures; a unit or
 * prefix is set smaller and muted so the number itself carries the tile.
 *
 * tone: accent | good | warn | serious | bad — colors the icon and the meter.
 * children: a custom value (a badge, a name, a date) instead of a number.
 */
export default function StatTile({
  label, value, unit, prefix, caption, icon: Icon, tone = "accent", meter, children, className = "",
}) {
  const color = `rgb(var(--${tone}))`;
  return (
    <div className={`kpi flex flex-col min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[14px] font-medium text-muted leading-snug">{label}</span>
        {Icon && (
          <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
            style={{ color, background: `rgb(var(--${tone}) / 0.12)` }}>
            <Icon className="w-[18px] h-[18px]" />
          </span>
        )}
      </div>

      {children !== undefined ? (
        <div className="mt-2 min-w-0 text-[19px] font-semibold text-ink leading-tight">{children}</div>
      ) : (
        <div className="flex items-baseline gap-1 mt-1.5">
          {prefix && <span className="text-[20px] font-medium text-muted">{prefix}</span>}
          <span className="text-[34px] leading-none font-semibold tracking-[-0.03em] text-ink">
            <CountUp value={value} />
          </span>
          {unit && <span className="text-[17px] font-medium text-muted ml-0.5">{unit}</span>}
        </div>
      )}

      {typeof meter === "number" && (
        <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: `rgb(var(--${tone}) / 0.15)` }}
          role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={meter} aria-label={label}>
          <div className="h-full rounded-full transition-[width] duration-1000 ease-out"
            style={{ width: `${Math.round(meter * 100)}%`, background: color }} />
        </div>
      )}

      {caption && <p className="text-[13px] text-muted leading-snug mt-2">{caption}</p>}
    </div>
  );
}
