import { useTranslation } from "react-i18next";

/** One shimmering block. */
export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/**
 * Loading state shaped like a page: title, a row of KPI tiles, two cards.
 * tiles = 0 drops the KPI row; rows = number of list lines in the cards.
 */
export default function PageSkeleton({ tiles = 4, cards = 2, rows = 4 }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4" role="status" aria-live="polite">
      <span className="sr-only">{t("common.loading")}</span>
      <div className="grid gap-2.5 mb-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-9 w-[min(360px,80%)]" />
        <Skeleton className="h-4 w-[min(480px,90%)]" />
      </div>
      {tiles > 0 && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
          {Array.from({ length: tiles }, (_, i) => (
            <div key={i} className="kpi grid gap-3">
              <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-9 w-9 !rounded-xl" /></div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      )}
      <div className={`grid gap-4 ${cards > 1 ? "xl:grid-cols-2" : ""}`}>
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="card grid gap-3.5">
            <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 !rounded-xl" /><Skeleton className="h-5 w-40" /></div>
            {Array.from({ length: rows }, (_, j) => <Skeleton key={j} className="h-[18px]" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
