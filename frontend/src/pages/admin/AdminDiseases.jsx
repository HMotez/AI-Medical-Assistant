import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import PageHead from "../../components/ui/PageHead";
import UrgencyBadge from "../../components/UrgencyBadge";
import { useMedicalLabels, searchable } from "../../i18n/medical";
import { URGENCY_TONE } from "../../constants/urgency";
import PageSkeleton from "../../components/ui/Skeleton";
import {
  Microscope, Search, Activity, Shield, ChevronDown, ChevronUp, AlertCircle, ArrowUpDown,
  Zap, AlertTriangle, CheckCircle
} from "lucide-react";
import StatTile from "../../components/ui/StatTile";

const URGENCY_ORDER = { emergency: 0, high: 1, moderate: 2, low: 3 };
const URGENCY_ICON = { emergency: Zap, high: AlertTriangle, moderate: AlertCircle, low: CheckCircle };

export default function AdminDiseases() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const [diseases, setDiseases]   = useState([]);
  const [symptoms, setSymptoms]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab]             = useState("diseases");
  const [query, setQuery]         = useState("");
  const [sortUrgency, setSort]    = useState(false);
  const [expanded, setExpanded]   = useState(null);

  // The same disease/symptom lists the AI model uses
  useEffect(() => {
    Promise.all([axiosClient.get("/api/diseases"), axiosClient.get("/api/symptoms")])
      .then(([d, s]) => {
        setDiseases(d.data.diseases || []);
        setSymptoms(s.data.symptoms || []);
        setLoadError(!(d.data.diseases || []).length);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const q = searchable(query);
  const byName = (a, b) => labels.disease(a.name).localeCompare(labels.disease(b.name), labels.lang);
  const filtered = diseases
    .filter(d => !q || [d.name, labels.disease(d.name), labels.specialist(d.specialist)].some(v => searchable(v).includes(q)))
    .sort((a, b) => (sortUrgency ? URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] : 0) || byName(a, b));
  const filteredSymptoms = symptoms
    .filter(s => !q || [s.replace(/_/g, " "), labels.symptom(s)].some(v => searchable(v).includes(q)))
    .sort((a, b) => labels.symptom(a).localeCompare(labels.symptom(b), labels.lang));

  const urgencyCount = (key) => diseases.filter(d => d.urgency === key).length;
  const switchTab = (next) => { setTab(next); setQuery(""); setExpanded(null); };

  return (
    <div className="grid gap-4">
      <PageHead
        eyebrow={t("admin.diseases.database")}
        title={t("admin.diseases.title")}
        subtitle={t("admin.diseases.subtitle", { diseases: diseases.length, symptoms: symptoms.length })}
      />

      {loading ? (
        <PageSkeleton cards={1} rows={8} />
      ) : loadError ? (
        <div className="alert-error"><AlertCircle className="w-4 h-4 shrink-0" /> {t("admin.diseases.loadError")}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
            {["emergency", "high", "moderate", "low"].map(key => (
              <StatTile key={key} label={t(`common.urgency.${key}`)} value={urgencyCount(key)}
                unit={t("landing.specialties.unit", { count: urgencyCount(key) })} icon={URGENCY_ICON[key]} tone={URGENCY_TONE[key]} />
            ))}
          </div>

          <section className="card">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div role="tablist" className="inline-flex gap-1 p-1 rounded-[14px] bg-panel2">
                {[
                  ["diseases", Microscope, t("admin.diseases.tabDiseases", { count: diseases.length })],
                  ["symptoms", Activity,   t("admin.diseases.tabSymptoms", { count: symptoms.length })],
                ].map(([key, Icon, label]) => (
                  <button key={key} role="tab" aria-selected={tab === key} onClick={() => switchTab(key)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14.5px] font-semibold transition-colors
                      ${tab === key ? "bg-accent text-white shadow-glow" : "text-muted hover:text-ink"}`}>
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-[14px] bg-panel2 px-3.5 py-2.5 flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-dim shrink-0" />
                <input type="text"
                  placeholder={t(tab === "diseases" ? "admin.diseases.searchDiseases" : "admin.diseases.searchSymptoms")}
                  aria-label={t(tab === "diseases" ? "admin.diseases.searchDiseases" : "admin.diseases.searchSymptoms")}
                  value={query} onChange={e => setQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-[15px] text-ink placeholder:text-dim" />
              </div>
              {tab === "diseases" && (
                <button onClick={() => setSort(s => !s)} aria-pressed={sortUrgency}
                  className={sortUrgency ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
                  <ArrowUpDown className="w-3.5 h-3.5" /> {t("admin.diseases.sortUrgency")}
                </button>
              )}
            </div>

            {tab === "diseases" && (
              <div className="grid gap-2">
                {filtered.map(d => (
                  <div key={d.name} className="rounded-[20px] border border-line bg-panel overflow-hidden">
                    <button onClick={() => setExpanded(expanded === d.name ? null : d.name)} aria-expanded={expanded === d.name}
                      className="w-full flex items-center gap-3.5 px-3 py-2.5 text-left hover:bg-raise transition-colors">
                      <div className="w-10 h-10 rounded-xl grid place-items-center bg-accent/10 text-accent shrink-0"><Microscope className="w-[18px] h-[18px]" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15.5px] font-semibold truncate">{labels.disease(d.name)}</div>
                        <div className="text-[13.5px] text-muted truncate">{labels.specialist(d.specialist)}</div>
                      </div>
                      <UrgencyBadge level={d.urgency} />
                      {expanded === d.name ? <ChevronUp className="w-4 h-4 text-dim" /> : <ChevronDown className="w-4 h-4 text-dim" />}
                    </button>
                    {expanded === d.name && (
                      <div className="grid sm:grid-cols-2 gap-3 px-4 pb-4 pt-1">
                        <div className="rounded-2xl bg-panel2 p-3.5">
                          <div className="eyebrow !text-muted">{t("admin.diseases.specialist")}</div>
                          <div className="font-semibold mt-1 flex items-center gap-1.5"><Shield className="w-4 h-4 text-accent" /> {labels.specialist(d.specialist)}</div>
                        </div>
                        <div className="rounded-2xl bg-panel2 p-3.5">
                          <div className="eyebrow !text-muted">{t("admin.diseases.urgency")}</div>
                          <div className="mt-1.5"><UrgencyBadge level={d.urgency} /></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filtered.length === 0 && <p className="text-center text-muted py-10">{t("admin.diseases.noDiseases")}</p>}
              </div>
            )}

            {tab === "symptoms" && (
              <>
                <div className="flex flex-wrap gap-2">
                  {filteredSymptoms.map(s => <span key={s} className="chip chip-accent !text-[14px] !py-1.5">{labels.symptom(s)}</span>)}
                </div>
                {filteredSymptoms.length === 0 && <p className="text-center text-muted py-8">{t("admin.diseases.noSymptoms")}</p>}
                <p className="alert-info mt-5 !text-[14px]"><AlertCircle className="w-4 h-4 shrink-0" />
                  {t("admin.diseases.footer", { symptoms: symptoms.length, diseases: diseases.length })}</p>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
