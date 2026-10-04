import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import UrgencyBadge from "../../components/UrgencyBadge";
import ConstellationStage from "../../components/three/ConstellationStage";
import { useMedicalLabels } from "../../i18n/medical";
import { dateLocale } from "../../i18n";
import { PHOTOS } from "../../constants/photos";
import {
  Activity, Plus, Clock, ChevronRight, FileText, User, MessageSquare, TrendingUp, Loader2, HeartPulse, CalendarDays
} from "lucide-react";
import StatTile from "../../components/ui/StatTile";

const SHORTCUTS = [
  { to: "/patient/history", Icon: Clock,         key: "history" },
  { to: "/patient/trends",  Icon: TrendingUp,    key: "trends" },
  { to: "/patient/chat",    Icon: MessageSquare, key: "chat" },
  { to: "/patient/profile", Icon: User,          key: "profile" },
];

export default function PatientDashboard() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    axiosClient.get("/api/analysis/")
      .then(r => setAnalyses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const latest = analyses[0];
  const fmtDate = (d) => new Date(d).toLocaleDateString(dateLocale(), { dateStyle: "medium" });

  return (
    <div className="grid gap-4">
      <ConstellationStage photo={PHOTOS.patientDash}>
        <span className="pill pill-glass w-fit mb-4"><Activity className="w-3.5 h-3.5" /> {t("dashboard.portal")}</span>
        <h1 className="text-[clamp(1.9rem,3.4vw,2.6rem)] font-bold leading-[1.05]">
          {t("dashboard.hello", { name: user?.full_name?.split(" ")[0] || "" })}
        </h1>
        <p className="text-white/85 text-[15.5px] mt-2 max-w-sm">{t("dashboard.overview")}</p>
        <div className="flex flex-wrap gap-2.5 mt-5">
          <Link to="/patient/analyze" className="btn-primary btn-light"><Plus className="w-4 h-4" /> {t("common.newAnalysis")}</Link>
          <Link to="/patient/chat" className="btn-ghost !bg-white/15 !text-white"><MessageSquare className="w-4 h-4" /> {t("sidebar.patient.chat")}</Link>
        </div>
      </ConstellationStage>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
        <StatTile label={t("dashboard.kpi.total")} value={loading ? null : analyses.length} icon={Activity} />
        <StatTile label={t("dashboard.kpi.latest")} icon={FileText}>
          <span className="block truncate">{latest?.top_disease ? labels.disease(latest.top_disease) : "—"}</span>
        </StatTile>
        <StatTile label={t("dashboard.kpi.urgency")} icon={HeartPulse}>
          {latest ? <UrgencyBadge level={latest.urgency_level} /> : "—"}
        </StatTile>
        <StatTile label={t("dashboard.kpi.lastCheck")} icon={CalendarDays}>
          {latest ? fmtDate(latest.created_at) : "—"}
        </StatTile>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4">
        {/* Recent analyses */}
        <section className="card">
          <div className="card-head">
            <div className="card-icon"><Activity className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0"><h2>{t("dashboard.recent")}</h2></div>
            <Link to="/patient/history" className="btn-ghost btn-sm">{t("common.viewAll")} <ChevronRight className="w-3.5 h-3.5" /></Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-10">
              <div className="card-icon mx-auto"><Activity className="w-5 h-5" /></div>
              <p className="font-display font-bold mt-3">{t("common.noAnalyses")}</p>
              <p className="text-muted text-[14.5px] mt-1 mb-5">{t("dashboard.emptyText")}</p>
              <Link to="/patient/analyze" className="btn-primary"><Plus className="w-4 h-4" /> {t("dashboard.startFirst")}</Link>
            </div>
          ) : (
            <div className="grid gap-2">
              {analyses.slice(0, 5).map(a => (
                <Link key={a.id} to={`/patient/results/${a.id}`}
                  className="group flex items-center gap-3.5 rounded-[20px] border border-line bg-panel px-3 py-2.5 transition-all hover:bg-raise hover:translate-x-1">
                  <div className="w-10 h-10 rounded-xl grid place-items-center bg-accent/10 text-accent shrink-0"><FileText className="w-[18px] h-[18px]" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15.5px] font-semibold truncate">
                      {a.top_disease ? labels.disease(a.top_disease) : t("common.analysisNumber", { id: a.id })}
                    </div>
                    <div className="text-[13.5px] text-muted">{fmtDate(a.created_at)}</div>
                  </div>
                  <UrgencyBadge level={a.urgency_level} />
                  <ChevronRight className="w-4 h-4 text-dim group-hover:text-accent shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Shortcuts */}
        <section className="card">
          <div className="card-head">
            <div className="card-icon"><ChevronRight className="w-5 h-5" /></div>
            <h2>{t("dashboard.shortcuts")}</h2>
          </div>
          <div className="grid gap-2">
            {SHORTCUTS.map(({ to, Icon, key }) => (
              <Link key={to} to={to}
                className="group flex items-center gap-3.5 rounded-[20px] bg-panel2 px-3 py-3 transition-all hover:bg-raise hover:translate-x-1">
                <div className="w-10 h-10 rounded-xl grid place-items-center bg-panel text-accent shrink-0 shadow-elev1"><Icon className="w-[18px] h-[18px]" /></div>
                <span className="flex-1 text-[15.5px] font-semibold">{t(`sidebar.patient.${key}`)}</span>
                <ChevronRight className="w-4 h-4 text-dim group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
