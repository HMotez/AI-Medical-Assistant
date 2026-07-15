import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  Activity, Download, ChevronLeft, Stethoscope,
  Zap, CheckCircle, AlertCircle, AlertTriangle,
  TrendingUp, TrendingDown, Loader2, MessageSquare, Brain
} from "lucide-react";

const URGENCY_META = {
  low:       { label: "Low Urgency",   bg: "from-green-400 to-emerald-500",  Icon: CheckCircle,   ring: "ring-green-400/40" },
  moderate:  { label: "Moderate",      bg: "from-amber-400 to-yellow-500",   Icon: AlertCircle,   ring: "ring-amber-400/40" },
  high:      { label: "High Urgency",  bg: "from-orange-400 to-red-400",     Icon: AlertTriangle, ring: "ring-orange-400/40" },
  emergency: { label: "EMERGENCY",     bg: "from-red-500 to-rose-600",       Icon: Zap,           ring: "ring-red-500/50" },
};

/* ── Donut chart for top-5 predictions ────────────────────────── */
const PIE_COLORS = ["#14b8a6", "#0891b2", "#6366f1", "#8b5cf6", "#ec4899"];

function DonutChart({ predictions }) {
  const RADIUS = 70, CX = 90, CY = 90, STROKE = 18;
  const circ   = 2 * Math.PI * RADIUS;
  const total  = predictions.reduce((s, p) => s + (p.confidence_score || 0), 0) || 1;

  let offset = 0;
  const slices = predictions.slice(0, 5).map((p, i) => {
    const pct  = (p.confidence_score || 0) / total;
    const dash = pct * circ;
    const gap  = circ - dash;
    const sl   = { offset, dash, gap, color: PIE_COLORS[i], pct };
    offset    += dash + 1;
    return sl;
  });

  const top = predictions[0];
  const topPct = Math.round((top?.confidence_score || 0) * 100);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="shrink-0 relative" style={{ width: 180, height: 180 }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          {/* Background ring */}
          <circle cx={CX} cy={CY} r={RADIUS} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
          {slices.map((sl, i) => (
            <circle key={i} cx={CX} cy={CY} r={RADIUS} fill="none"
              stroke={sl.color} strokeWidth={STROKE}
              strokeDasharray={`${sl.dash} ${sl.gap}`}
              strokeDashoffset={-sl.offset + circ / 4}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.6s ease", opacity: 0.9 }}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{topPct}%</span>
          <span className="text-[10px] text-white/40 font-semibold text-center px-3 leading-tight">
            Top Match
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 w-full">
        {predictions.slice(0, 5).map((p, i) => {
          const pct = Math.round((p.confidence_score || 0) * 100);
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
              <span className="text-xs text-white/70 flex-1 truncate font-semibold">
                {p.disease?.name || p.disease_name || p.disease}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: PIE_COLORS[i] }} />
                </div>
                <span className="text-xs font-black w-8 text-right" style={{ color: PIE_COLORS[i] }}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Animated SHAP bar ────────────────────────────────────────── */
function ShapBar({ symptom, score, maxAbs, index }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), index * 60);
    return () => clearTimeout(t);
  }, [index]);

  const positive = score >= 0;
  const pct      = maxAbs > 0 ? (Math.abs(score) / maxAbs) * 100 : 0;
  const label    = `${positive ? "+" : ""}${(score * 100).toFixed(1)}%`;

  return (
    <div className="group flex items-center gap-3 py-1">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
        ${positive ? "bg-green-500/15 border border-green-400/25" : "bg-red-500/15 border border-red-400/25"}`}>
        {positive
          ? <TrendingUp className="w-4 h-4 text-green-400" />
          : <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center text-xs font-bold mb-1.5">
          <span className="text-white/75 truncate max-w-[60%]">
            {symptom.replace(/_/g, " ")}
          </span>
          <span className={`shrink-0 ml-2 font-black ${positive ? "text-green-400" : "text-red-400"}`}>
            {label}
          </span>
        </div>
        {/* Bar track */}
        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out
              ${positive
                ? "bg-gradient-to-r from-green-400 to-emerald-300"
                : "bg-gradient-to-r from-red-400 to-rose-300"}`}
            style={{ width: mounted ? `${pct}%` : "0%" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  const { id } = useParams();
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    axiosClient.get(`/api/analysis/${id}`)
      .then(r => setData(r.data))
      .catch(() => setError("Failed to load analysis."))
      .finally(() => setLoading(false));
  }, [id]);

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await axiosClient.get(`/api/reports/${id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href = url; a.download = `medical-report-${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert("PDF generation failed."); }
    finally { setPdfLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
        <p className="font-bold text-white/60 mb-4">{error || "Analysis not found."}</p>
        <Link to="/patient" className="btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );

  const topPrediction = data.predictions?.[0];
  const symptoms      = data.symptoms || [];
  const urgencyMeta   = URGENCY_META[data.urgency_level] || URGENCY_META.low;
  const UrgencyIcon   = urgencyMeta.Icon;

  /* Parse SHAP explanation */
  let explanations = {};
  try {
    explanations = typeof data.explanation === "string"
      ? JSON.parse(data.explanation)
      : (data.explanation || {});
  } catch { explanations = {}; }

  const shapEntries = Object.entries(explanations)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 10);
  const maxAbs = shapEntries.reduce((m, [, v]) => Math.max(m, Math.abs(v)), 0);

  return (
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/patient"
            className="w-10 h-10 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl flex items-center justify-center text-white hover:bg-white/25 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-teal-300 text-xs font-black uppercase tracking-widest mb-1">AI Analysis</p>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Activity className="w-6 h-6" /> Analysis Result
            </h1>
            <p className="text-white/40 text-xs mt-1">
              {new Date(data.created_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/patient/chat"
            className="hidden sm:flex items-center gap-1.5 bg-purple-500/20 border border-purple-400/30 text-purple-300 font-bold text-sm px-4 py-2.5 rounded-full hover:bg-purple-500/30 transition-all">
            <MessageSquare className="w-4 h-4" /> Ask MedAI
          </Link>
          <button onClick={downloadPdf} disabled={pdfLoading}
            className="bg-white/15 backdrop-blur-sm border border-white/25 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-white/25 transition-all flex items-center gap-2 disabled:opacity-60">
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl space-y-5">

        {/* Urgency + Specialist */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className={`bg-gradient-to-br ${urgencyMeta.bg} rounded-2xl p-6 flex items-center gap-5 shadow-lg ring-4 ${urgencyMeta.ring}`}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <UrgencyIcon className="w-9 h-9 text-white" />
            </div>
            <div>
              <div className="text-white/70 text-xs font-black uppercase tracking-wider mb-1">Urgency Level</div>
              <div className="text-white font-black text-2xl">{urgencyMeta.label}</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex items-center gap-5">
            <div className="w-16 h-16 bg-teal-500/20 border border-teal-400/30 rounded-2xl flex items-center justify-center">
              <Stethoscope className="w-8 h-8 text-teal-300" />
            </div>
            <div>
              <div className="text-white/40 text-xs font-black uppercase tracking-wider mb-1">Recommended Specialist</div>
              <div className="text-white font-black text-xl">{data.recommended_specialist || "General Practitioner"}</div>
            </div>
          </div>
        </div>

        {/* Symptoms pills */}
        {symptoms.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="font-black text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-teal-400" />
              </div>
              Reported Symptoms ({symptoms.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((s, i) => (
                <span key={i} className="bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-bold px-3 py-1.5 rounded-full">
                  {(typeof s === "string" ? s : s.name || "").replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Predictions — donut + bars */}
        {data.predictions?.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="font-black text-white mb-5 flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-teal-400" />
              </div>
              Top Predictions
            </h2>
            <DonutChart predictions={data.predictions} />
          </div>
        )}

        {/* XAI — Explainable AI section */}
        {shapEntries.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="font-black text-white mb-1 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500/20 border border-purple-400/20 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
              Explainable AI — Symptom Influence
            </h2>
            <p className="text-xs text-white/35 mb-5 ml-11">
              How each symptom pushed the model toward or away from the top prediction (Leave-One-Out method)
            </p>

            {/* Color legend */}
            <div className="flex gap-6 mb-4 ml-11">
              <div className="flex items-center gap-2 text-xs text-green-300 font-semibold">
                <div className="w-3 h-3 rounded bg-green-400" />
                Supports prediction
              </div>
              <div className="flex items-center gap-2 text-xs text-red-300 font-semibold">
                <div className="w-3 h-3 rounded bg-red-400" />
                Against prediction
              </div>
            </div>

            <div className="space-y-1">
              {shapEntries.map(([sym, score], i) => (
                <ShapBar key={sym} symptom={sym} score={score} maxAbs={maxAbs} index={i} />
              ))}
            </div>

            {/* Mini insight */}
            {topPrediction && shapEntries[0] && (
              <div className="mt-5 bg-purple-500/10 border border-purple-400/20 rounded-xl p-4">
                <p className="text-xs text-purple-200 leading-relaxed">
                  <strong>Key insight:</strong> The symptom <strong className="text-purple-300">
                  {shapEntries[0][0].replace(/_/g, " ")}</strong> had the strongest influence on predicting{" "}
                  <strong className="text-purple-300">
                  {topPrediction.disease?.name || topPrediction.disease_name || topPrediction.disease}
                  </strong>{" "}
                  with {shapEntries[0][1] >= 0 ? "a positive" : "a negative"} contribution of{" "}
                  <strong>{Math.abs(shapEntries[0][1] * 100).toFixed(1)}%</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Doctor comments */}
        {data.doctor_comments?.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="font-black text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              Doctor Comments
            </h2>
            {data.doctor_comments.map((c, i) => (
              <div key={i} className="bg-blue-500/10 border border-blue-400/20 rounded-2xl p-5 mb-3">
                <div className="text-xs font-black text-blue-300 mb-2">Dr. {c.doctor?.full_name}</div>
                <p className="text-sm text-white/70 leading-relaxed">{c.comment}</p>
                {c.corrected_disease && (
                  <div className="mt-2 inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 text-xs font-black px-3 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Corrected: {c.corrected_disease}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick action — go to chat */}
        <div className="bg-purple-500/10 border border-purple-400/25 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6 text-purple-300" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm mb-0.5">Questions about this result?</p>
            <p className="text-white/45 text-xs">MedAI can explain your diagnosis and answer follow-up questions.</p>
          </div>
          <Link to="/patient/chat"
            className="shrink-0 bg-purple-500/30 border border-purple-400/40 text-purple-200 font-black text-xs px-4 py-2 rounded-full hover:bg-purple-500/40 transition-all">
            Open Chat
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-5 text-center">
          <p className="text-amber-200 text-xs font-semibold leading-relaxed">
            ⚠️ This analysis is for <strong>informational purposes only</strong>. Always consult a qualified
            healthcare professional for medical advice, diagnosis, or treatment.
          </p>
        </div>
      </div>
    </div>
  );
}
