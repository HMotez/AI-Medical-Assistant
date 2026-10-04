import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import { useMedicalLabels, searchable } from "../../i18n/medical";
import { Microscope, Search, Activity, Shield, ChevronDown, ChevronUp, AlertCircle, Loader2 } from "lucide-react";

const URGENCY_GLASS = {
  low:       "bg-green-500/20 text-green-300 border-green-400/30",
  moderate:  "bg-amber-500/20 text-amber-300 border-amber-400/30",
  high:      "bg-orange-500/20 text-orange-300 border-orange-400/30",
  emergency: "bg-red-500/20 text-red-300 border-red-400/30",
};

const URGENCY_SUMMARY = [
  { key: "emergency", color: "from-red-500/20 to-red-600/20",       border: "border-red-400/30",    dot: "bg-red-400",    text: "text-red-300" },
  { key: "high",      color: "from-orange-500/20 to-orange-600/20", border: "border-orange-400/30", dot: "bg-orange-400", text: "text-orange-300" },
  { key: "moderate",  color: "from-amber-500/20 to-amber-600/20",   border: "border-amber-400/30",  dot: "bg-amber-400",  text: "text-amber-300" },
  { key: "low",       color: "from-green-500/20 to-green-600/20",   border: "border-green-400/30",  dot: "bg-green-400",  text: "text-green-300" },
];
const URGENCY_ORDER = { emergency: 0, high: 1, moderate: 2, low: 3 };

export default function AdminDiseases() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const [diseases, setDiseases] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab]           = useState("diseases");
  const [query, setQuery]       = useState("");
  const [sortUrgency, setSort]  = useState(false);
  const [expanded, setExpanded] = useState(null);

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
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/25">
          <Microscope className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">{t("admin.diseases.database")}</p>
          <h1 className="text-2xl font-black text-white">{t("admin.diseases.title")}</h1>
          <p className="text-white/50 text-sm mt-0.5">
            {t("admin.diseases.subtitle", { diseases: diseases.length, symptoms: symptoms.length })}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-teal-400 animate-spin" /></div>
      ) : loadError ? (
        <div className="max-w-5xl bg-red-500/10 border border-red-400/25 rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white/70 font-bold">{t("admin.diseases.loadError")}</p>
        </div>
      ) : (
      <div className="max-w-5xl space-y-5">

        {/* Urgency summary */}
        <div className="grid grid-cols-4 gap-3">
          {URGENCY_SUMMARY.map(({ key, color, border, dot, text }) => (
            <div key={key} className={`bg-gradient-to-br ${color} backdrop-blur-md border ${border} rounded-2xl p-4 text-center`}>
              <div className={`w-3 h-3 ${dot} rounded-full mx-auto mb-2`} />
              <div className={`text-2xl font-black ${text}`}>{urgencyCount(key)}</div>
              <div className="text-xs font-bold text-white/50">{t(`common.urgency.${key}`)}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/10" role="tablist">
            <button role="tab" aria-selected={tab === "diseases"}
              onClick={() => switchTab("diseases")}
              className={`flex-1 py-4 text-sm font-black transition-colors flex items-center justify-center gap-2
                ${tab === "diseases" ? "bg-teal-500/20 text-teal-300 border-b-2 border-teal-400" : "text-white/50 hover:text-teal-300"}`}>
              <Microscope className="w-4 h-4" /> {t("admin.diseases.tabDiseases", { count: diseases.length })}
            </button>
            <button role="tab" aria-selected={tab === "symptoms"}
              onClick={() => switchTab("symptoms")}
              className={`flex-1 py-4 text-sm font-black transition-colors flex items-center justify-center gap-2
                ${tab === "symptoms" ? "bg-teal-500/20 text-teal-300 border-b-2 border-teal-400" : "text-white/50 hover:text-teal-300"}`}>
              <Activity className="w-4 h-4" /> {t("admin.diseases.tabSymptoms", { count: symptoms.length })}
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text"
                placeholder={t(tab === "diseases" ? "admin.diseases.searchDiseases" : "admin.diseases.searchSymptoms")}
                aria-label={t(tab === "diseases" ? "admin.diseases.searchDiseases" : "admin.diseases.searchSymptoms")}
                value={query} onChange={e => setQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all" />
            </div>
            {tab === "diseases" && (
              <button
                onClick={() => setSort(s => !s)} aria-pressed={sortUrgency}
                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all
                  ${sortUrgency ? "bg-teal-500 text-white border-teal-500" : "border-white/20 text-white/60 hover:border-teal-400/50 hover:text-teal-300"}`}>
                {t("admin.diseases.sortUrgency")} {sortUrgency ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Diseases tab */}
          {tab === "diseases" && (
            <div className="divide-y divide-white/5">
              {filtered.map(d => (
                <div key={d.name}>
                  <button
                    onClick={() => setExpanded(expanded === d.name ? null : d.name)}
                    aria-expanded={expanded === d.name}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/8 transition-colors text-left">
                    <div className="w-10 h-10 bg-teal-500/20 border border-teal-400/20 rounded-xl flex items-center justify-center shrink-0">
                      <Microscope className="w-5 h-5 text-teal-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm">{labels.disease(d.name)}</div>
                      <div className="text-xs text-white/40 mt-0.5">{labels.specialist(d.specialist)}</div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${URGENCY_GLASS[d.urgency]}`}>
                      {t(`common.urgency.${d.urgency}`)}
                    </span>
                    {expanded === d.name
                      ? <ChevronUp className="w-4 h-4 text-white/40 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
                  </button>
                  {expanded === d.name && (
                    <div className="px-6 pb-4">
                      <div className="bg-white/8 border border-white/10 rounded-xl p-4 ml-14 grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-black text-white/30 uppercase mb-1">{t("admin.diseases.specialist")}</div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-teal-400" /> {labels.specialist(d.specialist)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-black text-white/30 uppercase mb-1">{t("admin.diseases.urgency")}</div>
                          <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full border inline-block ${URGENCY_GLASS[d.urgency]}`}>
                            {t(`common.urgencyLong.${d.urgency}`)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-white/40 font-bold py-10">{t("admin.diseases.noDiseases")}</p>
              )}
            </div>
          )}

          {/* Symptoms tab */}
          {tab === "symptoms" && (
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {filteredSymptoms.map(s => (
                  <span key={s}
                    className="bg-teal-500/15 text-teal-200 border border-teal-400/25 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-teal-500/25 transition-colors">
                    {labels.symptom(s)}
                  </span>
                ))}
              </div>
              {filteredSymptoms.length === 0 && (
                <p className="text-center text-white/40 font-bold py-8">{t("admin.diseases.noSymptoms")}</p>
              )}
              <div className="mt-5 pt-4 border-t border-white/10 text-center">
                <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-semibold px-4 py-2 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  {t("admin.diseases.footer", { symptoms: symptoms.length, diseases: diseases.length })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
