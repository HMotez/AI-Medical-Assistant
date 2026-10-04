import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import PageHead from "../../components/ui/PageHead";
import UrgencyBadge from "../../components/UrgencyBadge";
import useChartTip from "../../components/charts/useChartTip";
import { useMedicalLabels } from "../../i18n/medical";
import { dateLocale } from "../../i18n";
import {
  TrendingUp, TrendingDown, Minus, Activity, Loader2, AlertTriangle, ChevronRight, Plus, Clock,
  CheckCircle, AlertCircle, Zap, HeartPulse
} from "lucide-react";
import StatTile from "../../components/ui/StatTile";

// Urgency colors (status palette) — every use also shows the icon and the word
const URGENCY_COLOR = {
  low:       "rgb(var(--good))",
  moderate:  "rgb(var(--warn))",
  high:      "rgb(var(--serious))",
  emergency: "rgb(var(--bad))",
};
const URGENCY_ICON = { low: CheckCircle, moderate: AlertCircle, high: AlertTriangle, emergency: Zap };

/* ── Confidence over time: one line, fixed 0–100% scale ───────── */
function TrendChart({ points }) {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const { bind, node } = useChartTip();
  const W = 640, H = 220, PAD = { top: 16, right: 18, bottom: 34, left: 44 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  if (points.length < 2) return null;

  const x = (i) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (v) => PAD.top + innerH - v * innerH;
  const line = points.map((p, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(p.confidence).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(points.length - 1)} ${PAD.top + innerH} L ${x(0)} ${PAD.top + innerH} Z`;
  const fmtDate = (d) => new Date(d).toLocaleDateString(dateLocale(), { day: "numeric", month: "short" });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[420px]" role="img" aria-label={t("trends.chartTitle")}>
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--chart-grid)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" fontSize="10" fill="rgb(var(--dim))" fontFamily="var(--f-mono)">
              {Math.round(v * 100)}%
            </text>
          </g>
        ))}
        <path d={area} fill="var(--chart-series)" fillOpacity="0.1" />
        <path d={line} fill="none" stroke="var(--chart-series)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={p.analysis_id}>
            <circle cx={x(i)} cy={y(p.confidence)} r="5.5" fill={URGENCY_COLOR[p.urgency] || URGENCY_COLOR.low}
              stroke="rgb(var(--panel))" strokeWidth="2" />
            <circle cx={x(i)} cy={y(p.confidence)} r="14" fill="transparent" {...bind(
              <><b>{labels.disease(p.top_disease)}</b><br />
                {fmtDate(p.date)} · {Math.round(p.confidence * 100)}% · {t(`common.urgency.${p.urgency || "low"}`)}</>
            )} />
            {(i === 0 || i === points.length - 1 || points.length <= 8) && (
              <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="rgb(var(--muted))">{fmtDate(p.date)}</text>
            )}
          </g>
        ))}
      </svg>
      {node}
    </div>
  );
}

function TrendPill({ shift }) {
  const { t } = useTranslation();
  if (shift === null || shift === undefined) return <span className="text-dim text-[13.5px]">—</span>;
  if (shift > 0) return <span className="chip chip-good"><TrendingUp className="w-3.5 h-3.5" /> {t("trends.improved")}</span>;
  if (shift < 0) return <span className="chip !bg-bad/10 !text-bad"><TrendingDown className="w-3.5 h-3.5" /> {t("trends.worsened")}</span>;
  return <span className="chip"><Minus className="w-3.5 h-3.5" /> {t("trends.stable")}</span>;
}

export default function HealthTrends() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const [points, setPoints]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    axiosClient.get("/api/analysis/trends?limit=15")
      .then(r => setPoints(r.data))
      .catch(() => setError("loadError"))
      .finally(() => setLoading(false));
  }, []);

  const delta = points.length >= 2
    ? ((points[points.length - 1].confidence - points[0].confidence) * 100).toFixed(1)
    : null;
  const uniqueDiseases = [...new Set(points.map(p => p.top_disease))];

  return (
    <div className="grid gap-4">
      <PageHead
        eyebrow={t("trends.yourHealth")}
        title={t("trends.title")}
        subtitle={t("trends.subtitle")}
        actions={<Link to="/patient/analyze" className="btn-primary"><Plus className="w-4 h-4" /> {t("common.newAnalysis")}</Link>}
      />

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-accent animate-spin" /></div>
      ) : error ? (
        <div className="alert-error"><AlertTriangle className="w-4 h-4 shrink-0" /> {t(`trends.${error}`)}</div>
      ) : points.length === 0 ? (
        <div className="card text-center !py-14">
          <div className="card-icon mx-auto"><Activity className="w-5 h-5" /></div>
          <p className="font-display font-bold text-[18.5px] mt-3">{t("common.noAnalyses")}</p>
          <p className="text-muted text-[14.5px] mt-1 mb-5">{t("trends.emptyText")}</p>
          <Link to="/patient/analyze" className="btn-primary"><Plus className="w-4 h-4" /> {t("trends.start")}</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
            <StatTile label={t("trends.analyses")} value={points.length} icon={Activity} />
            <StatTile label={t("trends.confidenceDelta")} icon={delta >= 0 ? TrendingUp : TrendingDown}
              value={delta !== null ? `${delta > 0 ? "+" : ""}${delta}` : null} unit={delta !== null ? "%" : undefined} />
            <StatTile className="col-span-2 lg:col-span-1" label={t("trends.conditions")} value={uniqueDiseases.length} icon={HeartPulse} />
          </div>

          {points.length >= 2 && (
            <section className="card">
              <div className="card-head">
                <div className="card-icon"><TrendingUp className="w-5 h-5" /></div>
                <div><h2>{t("trends.chartTitle")}</h2><small>{t("trends.chartText")}</small></div>
              </div>
              <TrendChart points={points} />
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.keys(URGENCY_COLOR).map(k => {
                  const Icon = URGENCY_ICON[k];
                  return (
                    <span key={k} className="chip !bg-transparent">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: URGENCY_COLOR[k] }} />
                      <Icon className="w-3 h-3" /> {t(`common.urgency.${k}`)}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          <section className="card">
            <div className="card-head">
              <div className="card-icon"><Clock className="w-5 h-5" /></div>
              <h2>{t("trends.timeline")}</h2>
            </div>
            <div className="grid gap-2">
              {[...points].reverse().map(p => (
                <Link key={p.analysis_id} to={`/patient/results/${p.analysis_id}`}
                  className="group flex flex-wrap items-center gap-3.5 rounded-[20px] border border-line bg-panel px-3 py-2.5 transition-all hover:bg-raise hover:translate-x-1">
                  <div className="flex-1 min-w-[160px]">
                    <div className="text-[15.5px] font-semibold truncate">{labels.disease(p.top_disease)}</div>
                    <div className="text-[13.5px] text-muted">{new Date(p.date).toLocaleString(dateLocale(), { dateStyle: "medium", timeStyle: "short" })}</div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 w-28">
                    <div className="flex-1 h-1.5 rounded-full bg-panel2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.round(p.confidence * 100)}%`, background: "var(--chart-series)" }} />
                    </div>
                    <span className="font-data text-[12.5px] text-muted w-9 text-right">{Math.round(p.confidence * 100)}%</span>
                  </div>
                  <UrgencyBadge level={p.urgency} />
                  <TrendPill shift={p.rank_shift} />
                  <ChevronRight className="w-4 h-4 text-dim group-hover:text-accent" />
                </Link>
              ))}
            </div>
          </section>

          <p className="text-center text-[13.5px] text-muted">{t("trends.disclaimer")}</p>
        </>
      )}
    </div>
  );
}
