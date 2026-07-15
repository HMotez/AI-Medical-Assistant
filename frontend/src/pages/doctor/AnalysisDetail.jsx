import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  ChevronLeft, Activity, Stethoscope, MessageSquare,
  Send, CheckCircle, AlertCircle, AlertTriangle, Zap, Loader2
} from "lucide-react";

const URGENCY_META = {
  low:       { label: "Low Urgency",       bg: "from-green-400 to-emerald-500",  Icon: CheckCircle,   ring: "ring-green-400/40" },
  moderate:  { label: "Moderate Urgency",  bg: "from-amber-400 to-yellow-500",   Icon: AlertCircle,   ring: "ring-amber-400/40" },
  high:      { label: "High Urgency",      bg: "from-orange-400 to-red-400",     Icon: AlertTriangle, ring: "ring-orange-400/40" },
  emergency: { label: "EMERGENCY",         bg: "from-red-500 to-rose-600",       Icon: Zap,           ring: "ring-red-500/50" },
};

export default function AnalysisDetail() {
  const { id } = useParams();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [comment, setComment]     = useState("");
  const [corrected, setCorrected] = useState("");
  const [sending, setSending]     = useState(false);
  const [success, setSuccess]     = useState(false);

  const load = () => {
    axiosClient.get(`/api/doctor/analyses/${id}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const sendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await axiosClient.post(`/api/doctor/analyses/${id}/comment`, {
        comment,
        corrected_disease: corrected || undefined,
      });
      setComment(""); setCorrected(""); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      load();
    } finally { setSending(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
    </div>
  );
  if (!data) return null;

  const urgencyMeta = URGENCY_META[data.urgency_level] || URGENCY_META.low;
  const UrgencyIcon = urgencyMeta.Icon;

  return (
    <div className="min-h-screen p-6 sm:p-8">
      <div className="max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/doctor"
            className="w-10 h-10 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl flex items-center justify-center text-white hover:bg-white/25 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-blue-300 text-xs font-black uppercase tracking-widest mb-1">Patient Analysis</p>
            <h1 className="text-2xl font-black text-white">{data.patient?.full_name}</h1>
            <p className="text-white/40 text-xs mt-0.5">
              {new Date(data.created_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>
        </div>

        <div className="space-y-5">

          {/* Urgency + Specialist */}
          <div className="grid md:grid-cols-2 gap-5">
            <div className={`bg-gradient-to-br ${urgencyMeta.bg} rounded-2xl p-6 flex items-center gap-5 shadow-lg ring-4 ${urgencyMeta.ring}`}>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <UrgencyIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-white/70 text-xs font-black uppercase tracking-wider mb-1">Urgency</div>
                <div className="text-white font-black text-xl">{urgencyMeta.label}</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 bg-teal-500/20 border border-teal-400/30 rounded-2xl flex items-center justify-center">
                <Stethoscope className="w-7 h-7 text-teal-300" />
              </div>
              <div>
                <div className="text-white/40 text-xs font-black uppercase tracking-wider mb-1">Specialist</div>
                <div className="text-white font-black text-xl">{data.specialist || "GP"}</div>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="font-black text-white mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" /> Reported Symptoms
            </h2>
            <div className="flex flex-wrap gap-2">
              {(data.symptoms || []).map((s, i) => (
                <span key={i} className="bg-teal-500/15 text-teal-200 border border-teal-400/25 text-xs font-bold px-3 py-1.5 rounded-full">
                  {(typeof s === "string" ? s : s.name || "").replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>

          {/* Predictions */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="font-black text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" /> AI Predictions
            </h2>
            <div className="space-y-3">
              {(data.predictions || []).map((p, i) => {
                const pct = Math.round((p.confidence_score || 0) * 100);
                const isTop = i === 0;
                return (
                  <div key={i} className={`rounded-xl p-4 border ${isTop ? "bg-teal-500/15 border-teal-400/30" : "bg-white/5 border-white/10"}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-white">
                        {isTop && <span className="text-xs bg-teal-500 text-white px-1.5 py-0.5 rounded-full mr-2">#1</span>}
                        {p.disease?.name || p.disease_name}
                      </span>
                      <span className={`text-sm font-black ${isTop ? "text-teal-300" : "text-white/50"}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isTop ? "bg-gradient-to-r from-teal-400 to-cyan-400" : "bg-white/20"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Existing comments */}
          {data.doctor_comments?.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h2 className="font-black text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" /> Previous Comments
              </h2>
              {data.doctor_comments.map((c, i) => (
                <div key={i} className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 mb-3">
                  <div className="text-xs text-blue-300 mb-1">Dr. {c.doctor?.full_name}</div>
                  <p className="text-sm text-white/70">{c.comment}</p>
                  {c.corrected_disease && (
                    <p className="text-xs text-blue-300 mt-1 font-bold">Correction: {c.corrected_disease}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="font-black text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-400" /> Add Comment
            </h2>

            {success && (
              <div className="flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 text-sm px-4 py-2 rounded-xl mb-4">
                <CheckCircle className="w-4 h-4" /> Comment added successfully.
              </div>
            )}

            <textarea
              value={comment} onChange={e => setComment(e.target.value)}
              rows={3} placeholder="Write your medical comment..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all mb-3"
            />
            <input type="text" value={corrected} onChange={e => setCorrected(e.target.value)}
              placeholder="Corrected diagnosis (optional)"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all mb-4" />
            <button onClick={sendComment} disabled={sending || !comment.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-60">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Comment
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
