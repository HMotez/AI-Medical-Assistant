import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import UrgencyBadge from "../../components/UrgencyBadge";
import { useMedicalLabels, searchable } from "../../i18n/medical";
import { dateLocale } from "../../i18n";
import { Stethoscope, Users, Activity, ChevronRight, AlertTriangle, Zap, Search, Loader2, MessageSquare } from "lucide-react";

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const { user }  = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState("");

  useEffect(() => {
    axiosClient.get("/api/doctor/analyses").then(r => setAnalyses(r.data)).finally(() => setLoading(false));
  }, []);

  // Search matches the patient name and the disease name in either language
  const q = searchable(query);
  const filtered = analyses.filter(a =>
    !q ||
    [a.patient_name, a.top_disease, a.top_disease && labels.disease(a.top_disease)]
      .some(v => searchable(v).includes(q))
  );

  const STATS = [
    { key: "total",     value: analyses.length,                                             Icon: Users,         color: "from-teal-400 to-teal-600" },
    { key: "high",      value: analyses.filter(a => a.urgency_level === "high").length,      Icon: AlertTriangle, color: "from-orange-400 to-orange-600" },
    { key: "emergency", value: analyses.filter(a => a.urgency_level === "emergency").length, Icon: Zap,           color: "from-red-400 to-red-600" },
  ];

  return (
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/25">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <div>
          <p className="text-blue-300 text-xs font-black uppercase tracking-widest mb-1">{t("doctor.portal")}</p>
          <h1 className="text-3xl font-black text-white">{t("doctor.title", { name: user?.full_name || "" })}</h1>
          <p className="text-white/50 text-sm mt-1">{t("doctor.subtitle")}</p>
        </div>
      </div>

      <div className="max-w-5xl space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {STATS.map(({ key, value, Icon, color }) => (
            <div key={key} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-all">
              <div className={`bg-gradient-to-r ${color} px-5 py-3 flex items-center gap-2`}>
                <Icon className="w-4 h-4 text-white" />
                <span className="text-white/80 text-xs font-black uppercase tracking-wide">{t(`doctor.stats.${key}`)}</span>
              </div>
              <div className="px-5 py-4">
                <div className="text-4xl font-black text-white">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Analyses list */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <h2 className="font-black text-white text-lg flex items-center gap-2 mb-4">
              <Stethoscope className="w-5 h-5 text-teal-400" /> {t("doctor.listTitle")}
            </h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text" placeholder={t("doctor.searchPlaceholder")} aria-label={t("doctor.searchPlaceholder")}
                value={query} onChange={e => setQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="font-bold text-white/40">{t("doctor.empty")}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(a => (
                <Link key={a.id} to={`/doctor/analysis/${a.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/8 group transition-colors">
                  <div className="w-11 h-11 bg-blue-500/20 border border-blue-400/20 rounded-xl flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-blue-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm">{a.patient_name || t("doctor.unknownPatient")}</div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {a.top_disease ? labels.disease(a.top_disease) : "—"} ·{" "}
                      {new Date(a.created_at).toLocaleDateString(dateLocale(), { dateStyle: "medium" })}
                    </div>
                  </div>
                  {a.has_comment && (
                    <span className="flex items-center gap-1 text-xs font-bold text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-full">
                      <MessageSquare className="w-3 h-3" /> {t("doctor.reviewed")}
                    </span>
                  )}
                  <UrgencyBadge level={a.urgency_level} />
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-teal-300 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
