import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import PageHead from "../../components/ui/PageHead";
import PredictionBars from "../../components/charts/PredictionBars";
import InfluenceBars from "../../components/charts/InfluenceBars";
import { useMedicalLabels } from "../../i18n/medical";
import { dateLocale } from "../../i18n";
import {
  ChevronLeft, Activity, Stethoscope, MessageSquare, Brain, Send, CheckCircle,
  AlertCircle, AlertTriangle, Zap, Loader2, TrendingUp
} from "lucide-react";

const URGENCY_META = {
  low:       { Icon: CheckCircle,   gradient: "linear-gradient(125deg, #3fd09a 0%, #14a36b 100%)" },
  moderate:  { Icon: AlertCircle,   gradient: "linear-gradient(125deg, #f6c453 0%, #c98a07 100%)" },
  high:      { Icon: AlertTriangle, gradient: "linear-gradient(125deg, #f8a066 0%, #e0702e 100%)" },
  emergency: { Icon: Zap,           gradient: "linear-gradient(125deg, #ff7a6e 0%, #e0453c 55%, #a8202a 100%)" },
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

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
  if (!data) return (
    <div className="card text-center !py-14 max-w-md mx-auto mt-10">
      <div className="card-icon mx-auto !text-bad !bg-bad/10"><AlertCircle className="w-5 h-5" /></div>
      <p className="font-display font-bold mt-3 mb-5">{t("doctor.detail.notFound")}</p>
      <Link to="/doctor" className="btn-primary">{t("common.back")}</Link>
    </div>
  );

  const urgencyKey = URGENCY_META[data.urgency_level] ? data.urgency_level : "low";
  const { Icon: UrgencyIcon, gradient } = URGENCY_META[urgencyKey];
  const review   = data.doctor_comment;
  const redFlags = data.details?.red_flags || [];
  const top      = data.predictions?.[0];

  let explanation = [];
  try {
    explanation = Object.entries(JSON.parse(data.explanation || "{}"))
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 8);
  } catch { explanation = []; }

  const sortedDiseases = [...diseases].sort((a, b) =>
    labels.disease(a.name).localeCompare(labels.disease(b.name), labels.lang));

  return (
    <div className="grid gap-4">
      <PageHead
        back={
          <Link to="/doctor" aria-label={t("common.back")}
            className="w-[42px] h-[42px] grid place-items-center rounded-full bg-panel border border-line text-ink hover:bg-raise shrink-0 mb-1">
            <ChevronLeft className="w-[18px] h-[18px]" />
          </Link>
        }
        eyebrow={t("doctor.detail.label")}
        title={data.patient_name}
        subtitle={<>
          {data.patient_age && data.patient_gender && <>{t("doctor.detail.patientInfo", { age: data.patient_age, gender: t(`common.gender.${data.patient_gender}`, { defaultValue: data.patient_gender }) })} · </>}
          {new Date(data.created_at).toLocaleString(dateLocale(), { dateStyle: "long", timeStyle: "short" })}
        </>}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="relative overflow-hidden rounded-[28px] p-7 text-white flex items-center gap-5"
          style={{ background: gradient, boxShadow: "0 30px 60px -32px rgba(0,0,0,0.45)" }}>
          <div className="w-14 h-14 rounded-2xl grid place-items-center bg-white/20 shrink-0"><UrgencyIcon className="w-7 h-7" /></div>
          <div>
            <div className="text-white/80 text-[13.5px] uppercase tracking-[0.14em]">{t("doctor.detail.urgency")}</div>
            <div className="font-display text-[27.5px] font-bold">{t(`common.urgencyLong.${urgencyKey}`)}</div>
          </div>
        </section>
        <section className="card flex items-center gap-4">
          <div className="card-icon"><Stethoscope className="w-5 h-5" /></div>
          <div>
            <small className="text-muted text-[13.5px]">{t("doctor.detail.specialist")}</small>
            <div className="font-display text-[21.5px] font-bold">{labels.specialist(data.recommended_specialist || "Médecin généraliste")}</div>
          </div>
        </section>
      </div>

      {redFlags.length > 0 && (
        <section className="card" style={{ boxShadow: "var(--elev-1), inset 0 0 0 1.5px rgb(var(--bad) / 0.35)" }}>
          <div className="card-head">
            <div className="card-icon !text-bad !bg-bad/10"><AlertTriangle className="w-5 h-5" /></div>
            <h2 className="!text-bad">{t("results.warningTitle")}</h2>
          </div>
          <ul className="grid gap-2">
            {redFlags.map((f, i) => (
              <li key={i} className="flex gap-3 text-[15.5px]">
                <span className={`urgency-${f.level} shrink-0 h-fit`}>{t(`common.urgency.${f.level}`)}</span>
                <span>{f.code ? t(`results.redFlags.${f.code}`, { defaultValue: f.message }) : f.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid xl:grid-cols-2 gap-4">
        <section className="card">
          <div className="card-head">
            <div className="card-icon"><TrendingUp className="w-5 h-5" /></div>
            <h2>{t("doctor.detail.predictions")}</h2>
          </div>
          <PredictionBars predictions={data.predictions || []} />
        </section>
        <section className="card">
          <div className="card-head">
            <div className="card-icon"><Brain className="w-5 h-5" /></div>
            <h2>{t("doctor.detail.explanation")}</h2>
          </div>
          {explanation.length > 0
            ? <InfluenceBars entries={explanation} disease={top ? labels.disease(top.disease) : ""} />
            : <p className="text-muted text-[14.5px]">—</p>}
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <div className="card-icon"><Activity className="w-5 h-5" /></div>
          <div className="flex-1"><h2>{t("doctor.detail.symptoms")}</h2></div>
          {data.severity && <span className="chip">{t("results.severityDuration", { severity: data.severity })}</span>}
          {data.symptom_duration && <span className="chip">{t(`common.durations.${data.symptom_duration}`, { defaultValue: data.symptom_duration })}</span>}
        </div>
        {data.symptoms?.length ? (
          <div className="flex flex-wrap gap-2">
            {data.symptoms.map(s => <span key={s} className="chip chip-accent !text-[14px]">{labels.symptom(s)}</span>)}
          </div>
        ) : <p className="text-muted text-[14.5px]">{t("doctor.detail.noSymptoms")}</p>}
        {data.free_text && (
          <div className="mt-4 rounded-2xl bg-panel2 p-4">
            <div className="eyebrow !text-muted">{t("doctor.detail.description")}</div>
            <p className="text-[15.5px] italic mt-1">"{data.free_text}"</p>
          </div>
        )}
      </section>

      <div className="grid xl:grid-cols-2 gap-4 items-start">
        {review && (
          <section className="card">
            <div className="card-head">
              <div className="card-icon"><MessageSquare className="w-5 h-5" /></div>
              <div><h2>{t("doctor.detail.previous")}</h2>
                {review.doctor_name && <small>{t("results.doctorPrefix", { name: review.doctor_name })}</small>}</div>
            </div>
            <p className="text-[15.5px]">{review.comment}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {review.corrected_disease && <span className="chip chip-accent">{t("doctor.detail.correction", { disease: labels.disease(review.corrected_disease) })}</span>}
              {review.is_validated && <span className="chip chip-good"><CheckCircle className="w-3 h-3" /> {t("doctor.detail.validated")}</span>}
            </div>
          </section>
        )}

        <section className={`card grid gap-4 ${review ? "" : "xl:col-span-2"}`}>
          <div className="card-head !mb-0">
            <div className="card-icon"><Send className="w-5 h-5" /></div>
            <h2>{t("doctor.detail.addComment")}</h2>
          </div>
          {status && (
            <div role="status" className={status === "saved" ? "alert-success" : "alert-error"}>
              {status === "saved" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {t(status === "saved" ? "doctor.detail.saved" : "doctor.detail.saveError")}
            </div>
          )}
          <div>
            <label htmlFor="review-comment" className="field-label">{t("doctor.detail.commentLabel")}</label>
            <textarea id="review-comment" value={comment} onChange={e => setComment(e.target.value)}
              rows={3} placeholder={t("doctor.detail.commentPlaceholder")} className="input-field resize-none" />
          </div>
          <div>
            <label htmlFor="review-corrected" className="field-label">{t("doctor.detail.correctedLabel")}</label>
            <select id="review-corrected" value={corrected} onChange={e => setCorrected(e.target.value)} className="input-field">
              <option value="">{t("doctor.detail.noCorrection")}</option>
              {sortedDiseases.map(d => <option key={d.name} value={d.name}>{labels.disease(d.name)}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2.5 text-[15px] cursor-pointer">
            <input type="checkbox" checked={validated} onChange={e => setValidated(e.target.checked)} className="w-4 h-4 accent-[rgb(var(--accent))]" />
            {t("doctor.detail.validate")}
          </label>
          <div>
            <button onClick={sendComment} disabled={sending || !comment.trim()} className="btn-primary">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {t("doctor.detail.submit")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
