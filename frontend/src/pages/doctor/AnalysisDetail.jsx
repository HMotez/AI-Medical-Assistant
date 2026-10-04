import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import { useMedicalLabels } from "../../i18n/medical";
import { dateLocale } from "../../i18n";
import {
  ChevronLeft, Activity, Stethoscope, MessageSquare, Brain,
  Send, CheckCircle, AlertCircle, AlertTriangle, Zap, Loader2
} from "lucide-react";

const URGENCY_META = {
  low:       { bg: "from-green-400 to-emerald-500",  Icon: CheckCircle,   ring: "ring-green-400/40" },
  moderate:  { bg: "from-amber-400 to-yellow-500",   Icon: AlertCircle,   ring: "ring-amber-400/40" },
  high:      { bg: "from-orange-400 to-red-400",     Icon: AlertTriangle, ring: "ring-orange-400/40" },
  emergency: { bg: "from-red-500 to-rose-600",       Icon: Zap,           ring: "ring-red-500/50" },
};

export default function AnalysisDetail() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const { id } = useParams();
  const [data, setData]           = useState(null);
  const [diseases, setDiseases]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [comment, setComment]     = useState("");
  const [corrected, setCorrected] = useState("");
  const [validated, setValidated] = useState(false);
  const [sending, setSending]     = useState(false);
  const [status, setStatus]       = useState(null);   // "saved" | "error"

  const load = useCallback(() => {
    axiosClient.get(`/api/doctor/analyses/${id}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Diseases the model knows, for the "corrected diagnosis" choice
  useEffect(() => {
    axiosClient.get("/api/diseases").then(r => setDiseases(r.data.diseases || [])).catch(() => {});
  }, []);

  const sendComment = async () => {
    if (!comment.trim()) return;
    setSending(true); setStatus(null);
    try {
      await axiosClient.post(`/api/doctor/analyses/${id}/comment`, {
        comment,
        corrected_disease: corrected || undefined,
        is_validated: validated,
      });
      setComment(""); setCorrected(""); setValidated(false); setStatus("saved");
      setTimeout(() => setStatus(null), 3000);
      load();
    } catch {
      setStatus("error");
    } finally { setSending(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
    </div>
  );
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="font-bold text-white/60 mb-4">{t("doctor.detail.notFound")}</p>
        <Link to="/doctor" className="btn-primary">{t("common.back")}</Link>
      </div>
    </div>
  );

  const urgencyKey  = URGENCY_META[data.urgency_level] ? data.urgency_level : "low";
  const urgencyMeta = URGENCY_META[urgencyKey];
  const UrgencyIcon = urgencyMeta.Icon;
  const review      = data.doctor_comment;
  const redFlags    = data.details?.red_flags || [];

  let explanation = [];
  try {
    explanation = Object.entries(JSON.parse(data.explanation || "{}"))
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6);
  } catch { explanation = []; }

  const sortedDiseases = [...diseases].sort((a, b) =>
    labels.disease(a.name).localeCompare(labels.disease(b.name), labels.lang));

  return (
    <div className="min-h-screen p-6 sm:p-8">
      <div className="max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/doctor" aria-label={t("common.back")}
            className="w-10 h-10 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl flex items-center justify-center text-white hover:bg-white/25 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-blue-300 text-xs font-black uppercase tracking-widest mb-1">{t("doctor.detail.label")}</p>
            <h1 className="text-2xl font-black text-white">{data.patient_name}</h1>
            <p className="text-white/40 text-xs mt-0.5">
              {data.patient_age && data.patient_gender && (
                <>{t("doctor.detail.patientInfo", { age: data.patient_age, gender: t(`common.gender.${data.patient_gender}`, { defaultValue: data.patient_gender }) })} · </>
              )}
              {new Date(data.created_at).toLocaleString(dateLocale(), { dateStyle: "long", timeStyle: "short" })}
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
                <div className="text-white/70 text-xs font-black uppercase tracking-wider mb-1">{t("doctor.detail.urgency")}</div>
                <div className="text-white font-black text-xl">{t(`common.urgencyLong.${urgencyKey}`)}</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 bg-teal-500/20 border border-teal-400/30 rounded-2xl flex items-center justify-center">
                <Stethoscope className="w-7 h-7 text-teal-300" />
              </div>
              <div>
                <div className="text-white/40 text-xs font-black uppercase tracking-wider mb-1">{t("doctor.detail.specialist")}</div>
                <div className="text-white font-black text-xl">{labels.specialist(data.recommended_specialist || "Médecin généraliste")}</div>
              </div>
            </div>
          </div>

          {/* Red flags */}
          {redFlags.length > 0 && (
            <div className="bg-red-500/15 border border-red-400/40 rounded-2xl p-5">
              <h2 className="font-black text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" /> {t("results.warningTitle")}
              </h2>
              <ul className="space-y-1.5">
                {redFlags.map((f, i) => (
                  <li key={i} className="text-sm text-red-100">
                    <span className="font-black uppercase text-xs text-red-300 mr-2">{t(`common.urgency.${f.level}`)}</span>
                    {f.code ? t(`results.redFlags.${f.code}`, { defaultValue: f.message }) : f.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Symptoms */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="font-black text-white mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" /> {t("doctor.detail.symptoms")}
            </h2>
            {(data.severity || data.symptom_duration) && (
              <p className="text-xs text-white/45 mb-3">
                {[data.severity && t("results.severityDuration", { severity: data.severity }),
                  data.symptom_duration && t(`common.durations.${data.symptom_duration}`, { defaultValue: data.symptom_duration })]
                  .filter(Boolean).join(" · ")}
              </p>
            )}
            {data.symptoms?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.symptoms.map(s => (
                  <span key={s} className="bg-teal-500/15 text-teal-200 border border-teal-400/25 text-xs font-bold px-3 py-1.5 rounded-full">
                    {labels.symptom(s)}
                  </span>
                ))}
              </div>
            ) : <p className="text-sm text-white/40">{t("doctor.detail.noSymptoms")}</p>}
            {data.free_text && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-white/40 text-xs font-black uppercase tracking-wider mb-1">{t("doctor.detail.description")}</div>
                <p className="text-sm text-white/80 italic">"{data.free_text}"</p>
              </div>
            )}
          </div>

          {/* Predictions */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="font-black text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" /> {t("doctor.detail.predictions")}
            </h2>
            <div className="space-y-3">
              {(data.predictions || []).map((p, i) => {
                const pct = Math.round((p.confidence || 0) * 100);
                const isTop = i === 0;
                return (
                  <div key={p.disease} className={`rounded-xl p-4 border ${isTop ? "bg-teal-500/15 border-teal-400/30" : "bg-white/5 border-white/10"}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-white">
                        {isTop && <span className="text-xs bg-teal-500 text-white px-1.5 py-0.5 rounded-full mr-2">#1</span>}
                        {labels.disease(p.disease)}
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
            {explanation.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="text-white/40 text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" /> {t("doctor.detail.explanation")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {explanation.map(([sym, score]) => (
                    <span key={sym} className={`text-xs font-bold px-3 py-1.5 rounded-full border
                      ${score >= 0 ? "bg-green-500/15 text-green-200 border-green-400/25" : "bg-red-500/15 text-red-200 border-red-400/25"}`}>
                      {labels.symptom(sym)} {score >= 0 ? "+" : "−"}{Math.abs(score * 100).toFixed(1)}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current review */}
          {review && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h2 className="font-black text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" /> {t("doctor.detail.previous")}
              </h2>
              <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4">
                {review.doctor_name && <div className="text-xs text-blue-300 mb-1">{t("results.doctorPrefix", { name: review.doctor_name })}</div>}
                <p className="text-sm text-white/70">{review.comment}</p>
                {review.corrected_disease && (
                  <p className="text-xs text-blue-300 mt-1 font-bold">{t("doctor.detail.correction", { disease: labels.disease(review.corrected_disease) })}</p>
                )}
                {review.is_validated && (
                  <p className="text-xs text-green-300 mt-1 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {t("doctor.detail.validated")}</p>
                )}
              </div>
            </div>
          )}

          {/* Add / update review */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="font-black text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-400" /> {t("doctor.detail.addComment")}
            </h2>

            {status && (
              <div role="status" className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl mb-4 border
                ${status === "saved" ? "bg-green-500/20 border-green-400/30 text-green-300" : "bg-red-500/20 border-red-400/30 text-red-300"}`}>
                {status === "saved" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {t(status === "saved" ? "doctor.detail.saved" : "doctor.detail.saveError")}
              </div>
            )}

            <label htmlFor="review-comment" className="block text-xs font-black text-white/50 uppercase tracking-wider mb-2">{t("doctor.detail.commentLabel")}</label>
            <textarea id="review-comment"
              value={comment} onChange={e => setComment(e.target.value)}
              rows={3} placeholder={t("doctor.detail.commentPlaceholder")}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all mb-3"
            />
            <label htmlFor="review-corrected" className="block text-xs font-black text-white/50 uppercase tracking-wider mb-2">{t("doctor.detail.correctedLabel")}</label>
            <select id="review-corrected" value={corrected} onChange={e => setCorrected(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-400/60 mb-4">
              <option value="" className="text-gray-900">{t("doctor.detail.noCorrection")}</option>
              {sortedDiseases.map(d => (
                <option key={d.name} value={d.name} className="text-gray-900">{labels.disease(d.name)}</option>
              ))}
            </select>
            <label className="flex items-center gap-2.5 text-sm text-white/70 mb-5 cursor-pointer">
              <input type="checkbox" checked={validated} onChange={e => setValidated(e.target.checked)} className="w-4 h-4 accent-teal-500" />
              {t("doctor.detail.validate")}
            </label>
            <button onClick={sendComment} disabled={sending || !comment.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-60">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("doctor.detail.submit")}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
