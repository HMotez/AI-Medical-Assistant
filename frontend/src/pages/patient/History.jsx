import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import UrgencyBadge from "../../components/UrgencyBadge";
import { useMedicalLabels, searchable } from "../../i18n/medical";
import { dateLocale } from "../../i18n";
import { Clock, ChevronRight, Activity, Trash2, Search, Loader2, Plus } from "lucide-react";

export default function History() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState("");
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    axiosClient.get("/api/analysis/").then(r => setAnalyses(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm(t("history.confirmDelete"))) return;
    setDeleting(id);
    try {
      await axiosClient.delete(`/api/analysis/${id}`);
      setAnalyses(prev => prev.filter(a => a.id !== id));
    } finally { setDeleting(null); }
  };

  // Search matches the disease name in the current language and in English
  const q = searchable(query);
  const filtered = analyses.filter(a =>
    !q || [a.top_disease, a.top_disease && labels.disease(a.top_disease)].some(n => searchable(n).includes(q))
  );

  return (
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/25">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">{t("history.records")}</p>
            <h1 className="text-2xl font-black text-white">{t("history.title")}</h1>
            <p className="text-white/50 text-sm mt-0.5">{t("history.total", { count: analyses.length })}</p>
          </div>
        </div>
        <Link to="/patient/analyze" className="btn-primary text-sm gap-2 hidden sm:flex">
          <Plus className="w-4 h-4" /> {t("common.newAnalysis")}
        </Link>
      </div>

      <div className="max-w-4xl space-y-5">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input type="text" placeholder={t("history.searchPlaceholder")} aria-label={t("history.searchPlaceholder")}
            value={query} onChange={e => setQuery(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-center py-16 px-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-white/30" />
            </div>
            <p className="font-black text-white/70 text-lg mb-1">
              {query ? t("history.noResults") : t("common.noAnalyses")}
            </p>
            <p className="text-white/40 text-sm mb-6">
              {query ? t("history.tryOther") : t("history.startNow")}
            </p>
            {!query && (
              <Link to="/patient/analyze" className="btn-primary inline-flex gap-2">
                <Plus className="w-4 h-4" /> {t("history.getStarted")}
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <span className="font-black text-white">{t("history.count", { count: filtered.length })}</span>
            </div>
            <div className="divide-y divide-white/5">
              {filtered.map(a => (
                <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/8 group transition-colors">
                  <div className="w-11 h-11 bg-teal-500/20 border border-teal-400/20 rounded-xl flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-teal-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm">
                      {a.top_disease ? labels.disease(a.top_disease) : t("common.analysisNumber", { id: a.id })}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {new Date(a.created_at).toLocaleString(dateLocale(), { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                  <UrgencyBadge level={a.urgency_level} />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button onClick={() => remove(a.id)} disabled={deleting === a.id} aria-label={t("history.deleteLabel")}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
                      {deleting === a.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                    <Link to={`/patient/results/${a.id}`} aria-label={t("history.openLabel")}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-teal-300 hover:bg-teal-500/20 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
