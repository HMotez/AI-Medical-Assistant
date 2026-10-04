import { useTranslation } from "react-i18next";
import { useMedicalLabels } from "../../i18n/medical";
import useChartTip from "./useChartTip";

/**
 * How much each reported symptom moved the top prediction (leave-one-out),
 * diverging from a center line: blue supports the prediction, red goes against it.
 */
export default function InfluenceBars({ entries, disease }) {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const { bind, node } = useChartTip();
  const maxAbs = entries.reduce((m, [, v]) => Math.max(m, Math.abs(v)), 0) || 1;

  return (
    <div>
      <div className="grid gap-3">
        {entries.map(([symptom, score]) => {
          const positive = score >= 0;
          const w = (Math.abs(score) / maxAbs) * 40;   // keep room for the value label
          const label = `${positive ? "+" : "−"}${Math.abs(score * 100).toFixed(1)}`;
          const name = labels.symptom(symptom);
          return (
            <div key={symptom} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-3 items-center text-[15px]">
              <span className="text-ink min-w-0 break-words">{name}</span>
              <div className="relative h-[18px]">
                <div className="absolute left-1/2 -top-1.5 -bottom-1.5 w-px bg-dim/60" />
                <div className={`absolute inset-y-0 ${positive ? "rounded-r" : "rounded-l"}`}
                  style={positive
                    ? { left: "50%", width: `${w}%`, background: "var(--chart-pos)" }
                    : { right: "50%", width: `${w}%`, background: "var(--chart-neg)" }} />
                <span className="font-data absolute top-1/2 -translate-y-1/2 text-[13.5px] text-ink whitespace-nowrap"
                  style={positive ? { left: `calc(50% + ${w}% + 8px)` } : { right: `calc(50% + ${w}% + 8px)` }}>
                  {label}
                </span>
                <div className="absolute -inset-y-1.5 inset-x-0" {...bind(
                  <><b>{name}</b><br />{t(positive ? "results.chart.supportsTip" : "results.chart.againstTip",
                    { disease, value: Math.abs(score * 100).toFixed(1) })}</>
                )} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-5 mt-4 text-[13.5px] text-muted">
        <span className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--chart-pos)" }} />{t("results.supports")}</span>
        <span className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--chart-neg)" }} />{t("results.against")}</span>
        <span className="text-dim">{t("results.chart.unit")}</span>
      </div>
      {node}
    </div>
  );
}
