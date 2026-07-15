import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  TrendingUp, TrendingDown, Minus, Activity, Loader2,
  AlertCircle, CheckCircle, Zap, AlertTriangle, ChevronRight, Plus
} from "lucide-react";

const URGENCY_COLOR = {
  low:       { dot: "#34d399", label: "Low",       bg: "rgba(52,211,153,0.15)" },
  moderate:  { dot: "#fbbf24", label: "Moderate",  bg: "rgba(251,191,36,0.15)" },
  high:      { dot: "#f97316", label: "High",      bg: "rgba(249,115,22,0.15)" },
  emergency: { dot: "#f43f5e", label: "Emergency", bg: "rgba(244,63,94,0.15)" },
};

const URGENCY_ICON = {
  low: CheckCircle, moderate: AlertCircle, high: AlertTriangle, emergency: Zap,
};

/* ── Inline SVG line chart ─────────────────────────────────────── */
function TrendChart({ points }) {
  const W = 600, H = 180, PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (points.length < 2) return null;

  const confs = points.map(p => p.confidence);
  const minC  = Math.min(...confs);
  const maxC  = Math.max(...confs);
  const range = maxC - minC || 0.1;

  const toX = (i) => PAD.left + (i / (points.length - 1)) * innerW;
  const toY = (v) => PAD.top  + innerH - ((v - minC) / range) * innerH;

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.confidence)}`).join(" ");
  const areaD = `${pathD} L ${toX(points.length - 1)} ${PAD.top + innerH} L ${toX(0)} ${PAD.top + innerH} Z`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: "360px" }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#14b8a6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = PAD.top + innerH * (1 - t);
          const v = Math.round((minC + range * t) * 100);
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              <text x={PAD.left - 6} y={y + 4} fill="rgba(255,255,255,0.35)"
                fontSize="10" textAnchor="end">{v}%</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#trendFill)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#14b8a6" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => {
          const cx = toX(i), cy = toY(p.confidence);
          const col = URGENCY_COLOR[p.urgency]?.dot || "#14b8a6";
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="6" fill="#0d2233" stroke={col} strokeWidth="2.5" />
              <circle cx={cx} cy={cy} r="2.5" fill={col} />
              {/* Date label */}
              <text x={cx} y={H - 6} fill="rgba(255,255,255,0.35)"
                fontSize="9" textAnchor="middle">
                {new Date(p.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Trend pill ─────────────────────────────────────────────────── */
function TrendPill({ shift }) {
  if (shift === null || shift === undefined) return <span className="text-white/30 text-xs">—</span>;
  if (shift > 0) return (
    <span className="inline-flex items-center gap-1 text-green-400 text-xs font-bold">
      <TrendingUp className="w-3.5 h-3.5" /> Improved
    </span>
  );
  if (shift < 0) return (
    <span className="inline-flex items-center gap-1 text-red-400 text-xs font-bold">
      <TrendingDown className="w-3.5 h-3.5" /> Worsened
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-white/50 text-xs font-bold">
      <Minus className="w-3.5 h-3.5" /> Stable
    </span>
  );
}

export default function HealthTrends() {
  const [points, setPoints]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    axiosClient.get("/api/analysis/trends?limit=15")
      .then(r => setPoints(r.data))
      .catch(() => setError("Unable to load trend data."))
      .finally(() => setLoading(false));
  }, []);

  /* Confidence delta first vs last */
  const delta = points.length >= 2
    ? ((points[points.length - 1].confidence - points[0].confidence) * 100).toFixed(1)
    : null;

  const uniqueDiseases = [...new Set(points.map(p => p.top_disease))];

  return (
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/25">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Your Health</p>
            <h1 className="text-2xl font-black text-white">Evolution Tracking</h1>
            <p className="text-white/50 text-sm mt-0.5">Confidence trend over your last analyses</p>
          </div>
        </div>
        <Link to="/patient/analyze"
          className="hidden sm:flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 text-teal-300 font-bold text-sm px-4 py-2.5 rounded-full hover:bg-teal-500/30 transition-all">
          <Plus className="w-4 h-4" /> New Analysis
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-400/25 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white/70 font-bold">{error}</p>
        </div>
      ) : points.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-center py-20 px-6">
          <Activity className="w-14 h-14 text-white/20 mx-auto mb-4" />
          <p className="font-black text-white/70 text-lg mb-2">No analyses yet</p>
          <p className="text-white/40 text-sm mb-6">Run your first symptom analysis to start tracking evolution.</p>
          <Link to="/patient/analyze" className="btn-primary inline-flex gap-2">
            <Plus className="w-4 h-4" /> Start Analysis
          </Link>
        </div>
      ) : (
        <div className="max-w-4xl space-y-5">

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
              <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-2">Analyses</p>
              <p className="text-white font-black text-3xl">{points.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
              <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-2">Confidence Δ</p>
              <p className={`font-black text-3xl ${delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                {delta !== null ? `${delta > 0 ? "+" : ""}${delta}%` : "—"}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 col-span-2 sm:col-span-1">
              <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-2">Conditions Detected</p>
              <p className="text-white font-black text-3xl">{uniqueDiseases.length}</p>
            </div>
          </div>

          {/* Chart */}
          {points.length >= 2 && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h2 className="font-black text-white mb-1 flex items-center gap-2">
                <div className="w-7 h-7 bg-teal-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                </div>
                Confidence Over Time
              </h2>
              <p className="text-xs text-white/35 mb-5 ml-9">Top predicted condition confidence per analysis</p>
              <TrendChart points={points} />

              {/* Urgency legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10">
                {Object.entries(URGENCY_COLOR).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: v.dot }} />
                    <span className="text-white/40 text-xs font-semibold">{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="font-black text-white">Analysis Timeline</h2>
            </div>
            <div className="divide-y divide-white/5">
              {[...points].reverse().map((p, i) => {
                const UIcon = URGENCY_ICON[p.urgency] || CheckCircle;
                const col   = URGENCY_COLOR[p.urgency] || URGENCY_COLOR.low;
                return (
                  <div key={p.analysis_id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors group">
                    {/* Urgency dot */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: col.bg, border: `1px solid ${col.dot}40` }}>
                      <UIcon className="w-5 h-5" style={{ color: col.dot }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate">{p.top_disease}</div>
                      <div className="text-xs text-white/35 mt-0.5">
                        {new Date(p.date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-24">
                      <span className="text-white/70 font-black text-sm">
                        {Math.round(p.confidence * 100)}%
                      </span>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-teal-400 transition-all"
                          style={{ width: `${Math.round(p.confidence * 100)}%` }} />
                      </div>
                    </div>

                    <TrendPill shift={p.rank_shift} />

                    <Link to={`/patient/results/${p.analysis_id}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30
                        hover:text-teal-300 hover:bg-teal-500/20 transition-all opacity-0 group-hover:opacity-100 shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 text-center">
            <p className="text-amber-200 text-xs font-semibold leading-relaxed">
              ⚠️ Ces tendances sont basées sur les résultats de l'IA et ne remplacent pas un suivi médical professionnel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
