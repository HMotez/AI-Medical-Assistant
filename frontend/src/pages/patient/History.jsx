import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import UrgencyBadge from "../../components/UrgencyBadge";
import PageHead from "../../components/ui/PageHead";
import { useMedicalLabels, searchable } from "../../i18n/medical";
import { dateLocale } from "../../i18n";
import { ChevronRight, Activity, Trash2, Search, Loader2, Plus, FileText } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";

export default function History() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    axiosClient.get("/api/analysis/").then(r => setAnalyses(r.data)).finally(() => setLoading(false));
  }, []);

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
    <div>
      <PageHead
        eyebrow={t("history.records")}
        title={t("history.title")}
        subtitle={t("history.total", { count: analyses.length })}
        actions={
          <div className="flex items-center gap-2 glass-btn rounded-[14px] px-3.5 py-2.5 w-[min(320px,80vw)]">
            <Search className="w-4 h-4 text-white/70 shrink-0" />
            <input type="text" placeholder={t("history.searchPlaceholder")} aria-label={t("history.searchPlaceholder")}
              value={query} onChange={e => setQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-[15px] text-white placeholder:text-white/60" />
          </div>
        }
      />

      {loading ? (
        <div className="card grid gap-3" role="status"><span className="sr-only">{t("common.loading")}</span>{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 !rounded-[20px]" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center !py-14">
          <div className="card-icon mx-auto"><Activity className="w-5 h-5" /></div>
          <p className="font-display font-bold text-[18.5px] mt-3">{query ? t("history.noResults") : t("common.noAnalyses")}</p>
          <p className="text-muted text-[14.5px] mt-1 mb-5">{query ? t("history.tryOther") : t("history.startNow")}</p>
          {!query && <Link to="/patient/analyze" className="btn-primary"><Plus className="w-4 h-4" /> {t("history.getStarted")}</Link>}
        </div>
      ) : (
        <section className="card">
          <div className="card-head">
            <div className="card-icon"><FileText className="w-5 h-5" /></div>
            <h2>{t("history.count", { count: filtered.length })}</h2>
          </div>
          <div className="grid gap-2">
            {filtered.map(a => (
              <div key={a.id} className="group flex items-center gap-3.5 rounded-[20px] border border-line bg-panel px-3 py-2.5 transition-all hover:bg-raise">
                <div className="w-10 h-10 rounded-xl grid place-items-center bg-accent/10 text-accent shrink-0"><Activity className="w-[18px] h-[18px]" /></div>
                <Link to={`/patient/results/${a.id}`} className="flex-1 min-w-0">
                  <div className="text-[15.5px] font-semibold truncate">
                    {a.top_disease ? labels.disease(a.top_disease) : t("common.analysisNumber", { id: a.id })}
                  </div>
                  <div className="text-[13.5px] text-muted">
                    {new Date(a.created_at).toLocaleString(dateLocale(), { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </Link>
                <UrgencyBadge level={a.urgency_level} />
                <button onClick={() => remove(a.id)} disabled={deleting === a.id} aria-label={t("history.deleteLabel")}
                  className="w-9 h-9 rounded-xl grid place-items-center text-dim hover:text-bad hover:bg-bad/10 transition-colors disabled:opacity-50">
                  {deleting === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
                <Link to={`/patient/results/${a.id}`} aria-label={t("history.openLabel")}
                  className="w-9 h-9 rounded-xl grid place-items-center text-dim hover:text-accent hover:bg-accent/10 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
