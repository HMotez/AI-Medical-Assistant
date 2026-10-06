import { useTranslation } from "react-i18next";
import { useMedicalLabels } from "../../i18n/medical";
import useChartTip from "./useChartTip";

const confidenceOf = (p) => p.confidence ?? p.confidence_score ?? 0;
const diseaseName  = (p) => p.disease?.name || p.disease_name || p.disease;
const TICKS = [0, 25, 50, 75, 100];

/** Probability of each condition, one hue, drawn to scale on a 0–100% axis. */
export default function PredictionBars({ predictions }) {
  const { t, i18n } = useTranslation();
  const labels = useMedicalLabels();
  const { bind, node } = useChartTip();
  const fmt = (p) => {
    const pct = p * 100;
    const value = pct >= 10 ? Math.round(pct) : pct.toFixed(1);
    return i18n.language?.startsWith("fr") ? `${String(value).replace(".", ",")} %` : `${value}%`;
  };

  return (
    <div>
      <div className="grid gap-3">
        {predictions.slice(0, 5).map((p, i) => {
          const value = confidenceOf(p);
          const width = `${Math.max(value * 100, 0.6).toFixed(2)}%`;
          const name = labels.disease(diseaseName(p));
          return (
            <div key={diseaseName(p)} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-3 items-center text-[15px]">
              <span className={`text-ink min-w-0 break-words ${i === 0 ? "font-bold" : "text-muted"}`}>{name}</span>
              <div className="relative h-[18px]">
                {/* gridlines */}
                <div className="absolute -inset-y-1.5 inset-x-0 pointer-events-none"
                  style={{ background: "linear-gradient(90deg, var(--chart-grid) 1px, transparent 1px) 0 0 / 25% 100%", borderRight: "1px solid var(--chart-grid)" }} />
                <div className="absolute inset-y-0 left-0 rounded-r"
                  style={{ width, background: "var(--chart-series)" }} />
                {/* a long bar carries its value inside, so the label never leaves the card */}
                <span className={`font-data absolute top-1/2 -translate-y-1/2 text-[13.5px] whitespace-nowrap ${value > 0.82 ? "text-white" : "text-ink"}`}
                  style={value > 0.82 ? { right: `calc(100% - ${width} + 8px)` } : { left: `calc(${width} + 8px)` }}>
                  {fmt(value)}
                </span>
                <div className="absolute -inset-y-1.5 inset-x-0" {...bind(
                  <><b>{name}</b><br />{t("results.chart.rank", { rank: i + 1 })} · {fmt(value)}</>
                )} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-3 mt-2" aria-hidden="true">
        <span />
        <div className="relative h-4 font-data text-[11.5px] text-dim">
          {TICKS.map((tick, i) => (
            <span key={tick} className="absolute"
              style={{ left: `${tick}%`, transform: i === 0 ? "none" : i === TICKS.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}>
              {tick}{i === TICKS.length - 1 ? " %" : ""}
            </span>
          ))}
        </div>
      </div>
      {node}
    </div>
  );
}
