import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import { useMedicalLabels } from "../../i18n/medical";
import { currentLang, dateLocale } from "../../i18n";
import PredictionBars from "../../components/charts/PredictionBars";
import InfluenceBars from "../../components/charts/InfluenceBars";
import PageHead from "../../components/ui/PageHead";
import { URGENCY_META } from "../../constants/urgency";
import PageSkeleton from "../../components/ui/Skeleton";
import {
  Download, ChevronLeft, Stethoscope, Zap, CheckCircle, AlertCircle, AlertTriangle,
  TrendingUp, Loader2, MessageSquare, Brain, HelpCircle, Plus, ClipboardList
} from "lucide-react";


const diseaseName = (p) => p.disease?.name || p.disease_name || p.disease;

export default function Results() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const { id } = useParams();
  const navigate = useNavigate();
  const [addingSymptom, setAddingSymptom] = useState(null);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    setLoading(true);
    axiosClient.get(`/api/analysis/${id}`)
      .then(r => setData(r.data))
      .catch(() => setError("results.loadError"))
      .finally(() => setLoading(false));
  }, [id]);

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await axiosClient.get(`/api/reports/${id}/download`, { params: { lang: currentLang() }, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href = url; a.download = `medical-report-${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert(t("results.pdfFailed")); }
    finally { setPdfLoading(false); }
  };

  const reanalyzeWith = async (symptom) => {
    setAddingSymptom(symptom);
    try {
      const { data: created } = await axiosClient.post("/api/analysis", {
        symptom_names:    [...(data.symptoms || []), symptom],
        severity:         data.severity ?? undefined,
        symptom_duration: data.symptom_duration ?? undefined,
      });
      navigate(`/patient/results/${created.id}`);
    } catch { alert(t("results.reanalyzeFailed")); }
    finally { setAddingSymptom(null); }
  };

  if (loading) return <PageSkeleton tiles={0} />;

  if (error || !data) return (
    <div className="card text-center !py-14 max-w-md mx-auto mt-10">
      <div className="card-icon mx-auto !text-bad !bg-bad/10"><AlertCircle className="w-5 h-5" /></div>
      <p className="font-display font-bold mt-3 mb-5">{t(error || "results.notFound")}</p>
      <Link to="/patient" className="btn-primary">{t("results.backToDashboard")}</Link>
    </div>
  );

  const topPrediction = data.predictions?.[0];
  const symptoms      = data.symptoms || [];
  const urgencyKey    = URGENCY_META[data.urgency_level] ? data.urgency_level : "low";
  const { Icon: UrgencyIcon, gradient } = URGENCY_META[urgencyKey];
  const details       = data.details || {};
  const redFlags      = details.red_flags || [];
  const followUps     = details.follow_up_questions || [];

  /* Symptom influence (leave-one-out) */
  let explanations = {};
  try {
    explanations = typeof data.explanation === "string" ? JSON.parse(data.explanation) : (data.explanation || {});
  } catch { explanations = {}; }
  const shapEntries = Object.entries(explanations).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 10);

  return (
    <div className="grid gap-4">
      <PageHead
        back={
          <Link to="/patient" aria-label={t("common.back")}
            className="glass-btn w-[42px] h-[42px] grid place-items-center rounded-full shrink-0 mb-1 transition-colors">
            <ChevronLeft className="w-[18px] h-[18px]" />
          </Link>
        }
        eyebrow={t("results.aiAnalysis")}
        title={t("results.title")}
        subtitle={new Date(data.created_at).toLocaleString(dateLocale(), { dateStyle: "long", timeStyle: "short" })}
        actions={<>
          <Link to="/patient/chat" className="btn-ghost"><MessageSquare className="w-4 h-4" /> {t("results.askMedAI")}</Link>
          <button onClick={downloadPdf} disabled={pdfLoading} className="btn-primary">
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
          </button>
        </>}
      />

      {/* Urgency + next step */}
      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4">
        <section className="relative overflow-hidden rounded-[28px] p-7 text-white min-h-[200px] flex flex-col justify-between"
          style={{ background: gradient, boxShadow: "0 30px 60px -32px rgba(0,0,0,0.45)" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-white/20"><UrgencyIcon className="w-6 h-6" /></div>
            <span className="pill pill-glass">{t("results.urgencyLevel")}</span>
          </div>
          <div>
            <div className="font-display text-[36px] font-bold leading-tight">{t(`common.urgencyLong.${urgencyKey}`)}</div>
            {topPrediction && (
              <p className="text-white/90 text-[15.5px] mt-1">
                {labels.disease(diseaseName(topPrediction))} · <span className="font-data">{Math.round((topPrediction.confidence ?? 0) * 100)}%</span>
              </p>
            )}
          </div>
          <UrgencyIcon className="absolute -right-6 -bottom-8 w-44 h-44 text-white/10" aria-hidden="true" />
        </section>

        <section className="card">
          <div className="card-head">
            <div className="card-icon"><Stethoscope className="w-5 h-5" /></div>
            <div className="min-w-0">
              <small>{t("results.specialist")}</small>
              <h2 className="!text-[19.5px]">{labels.specialist(data.recommended_specialist || "Médecin généraliste")}</h2>
            </div>
          </div>
          {(data.severity || data.symptom_duration) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {data.severity && <span className="chip">{t("results.severityDuration", { severity: data.severity })}</span>}
              {data.symptom_duration && <span className="chip">{t(`common.durations.${data.symptom_duration}`, { defaultValue: data.symptom_duration })}</span>}
            </div>
          )}
          {followUps.length > 0 && (
            <>
              <p className="text-[14.5px] font-semibold flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-accent" /> {t("results.followUpTitle")}</p>
              <p className="text-[13.5px] text-muted mt-0.5 mb-3">{t("results.followUpText")}</p>
              <div className="flex flex-wrap gap-2">
                {followUps.map(q => (
                  <button key={q.symptom} onClick={() => reanalyzeWith(q.symptom)} disabled={addingSymptom !== null}
                    className="btn-ghost btn-sm !bg-accent/10 !text-accent">
                    {addingSymptom === q.symptom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    {labels.symptom(q.symptom)}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Warning signs */}
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
          {data.urgency_level === "emergency" && <p className="alert-error mt-4 !font-semibold"><Zap className="w-4 h-4 shrink-0" /> {t("results.callEmergency")}</p>}
        </section>
      )}

      {details.is_uncertain && (
        <p className="alert-warning"><HelpCircle className="w-4 h-4 shrink-0" />
          <span><strong>{t("results.uncertainTitle")}</strong> {t("results.uncertainText")}</span></p>
      )}

      {/* Charts */}
      <div className="grid xl:grid-cols-2 gap-4">
        {data.predictions?.length > 0 && (
          <section className="card">
            <div className="card-head">
              <div className="card-icon"><TrendingUp className="w-5 h-5" /></div>
              <div><h2>{t("results.topPredictions")}</h2><small>{t("results.topMatch")}: {labels.disease(diseaseName(topPrediction))}</small></div>
            </div>
            <PredictionBars predictions={data.predictions} />
          </section>
        )}
        {shapEntries.length > 0 && (
          <section className="card">
            <div className="card-head">
              <div className="card-icon"><Brain className="w-5 h-5" /></div>
              <div><h2>{t("results.xaiTitle")}</h2><small>{t("results.xaiText")}</small></div>
            </div>
            <InfluenceBars entries={shapEntries} disease={topPrediction ? labels.disease(diseaseName(topPrediction)) : ""} />
            {topPrediction && shapEntries[0] && (
              <p className="mt-4 rounded-2xl bg-panel2 p-4 text-[14px] text-muted leading-relaxed">
                <Trans i18nKey="results.keyInsight"
                  values={{
                    symptom:   labels.symptom(shapEntries[0][0]),
                    disease:   labels.disease(diseaseName(topPrediction)),
                    direction: t(shapEntries[0][1] >= 0 ? "results.positive" : "results.negative"),
                    value:     Math.abs(shapEntries[0][1] * 100).toFixed(1),
                  }}
                  components={{ b: <strong className="text-ink" />, hl: <strong className="text-accent" /> }} />
              </p>
            )}
          </section>
        )}
      </div>

      {/* Symptoms + description */}
      {(symptoms.length > 0 || data.free_text) && (
        <section className="card">
          <div className="card-head">
            <div className="card-icon"><ClipboardList className="w-5 h-5" /></div>
            <h2>{t("results.reported", { count: symptoms.length })}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {symptoms.map(s => <span key={s} className="chip chip-accent !text-[14px]">{labels.symptom(s)}</span>)}
          </div>
          {data.free_text && (
            <div className="mt-4 rounded-2xl bg-panel2 p-4">
              <div className="eyebrow !text-muted">{t("results.yourDescription")}</div>
              <p className="text-[15.5px] italic mt-1">"{data.free_text}"</p>
            </div>
          )}
        </section>
      )}

      {/* Doctor review */}
      {data.doctor_review && (
        <section className="card">
          <div className="card-head">
            <div className="card-icon"><MessageSquare className="w-5 h-5" /></div>
            <div><h2>{t("results.doctorComments")}</h2>
              {data.doctor_review.doctor_name && <small>{t("results.doctorPrefix", { name: data.doctor_review.doctor_name })}</small>}</div>
          </div>
          <p className="text-[15.5px] leading-relaxed">{data.doctor_review.comment}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {data.doctor_review.corrected_disease && (
              <span className="chip chip-accent"><CheckCircle className="w-3 h-3" /> {t("results.corrected", { disease: labels.disease(data.doctor_review.corrected_disease) })}</span>
            )}
            {data.doctor_review.is_validated && <span className="chip chip-good"><CheckCircle className="w-3 h-3" /> {t("doctor.detail.validated")}</span>}
          </div>
        </section>
      )}

      <p className="text-center text-[13.5px] text-muted px-4">
        <Trans i18nKey="common.disclaimer" components={{ strong: <strong className="text-ink" /> }} />
      </p>
    </div>
  );
}
