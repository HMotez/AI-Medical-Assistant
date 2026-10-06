import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import UrgencyBadge from "../../components/UrgencyBadge";
import ConstellationStage from "../../components/three/ConstellationStage";
import { useMedicalLabels, searchable } from "../../i18n/medical";
import { dateLocale } from "../../i18n";
import { PHOTOS } from "../../constants/photos";
import { Stethoscope, Users, Activity, ChevronRight, AlertTriangle, Zap, Search, Loader2, MessageSquare } from "lucide-react";
import StatTile from "../../components/ui/StatTile";
import { withoutTitle } from "../../utils/names";

// Emergencies first, then high, then the rest — so what needs a doctor is at the top
const URGENCY_RANK = { emergency: 0, high: 1, moderate: 2, low: 3 };

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
  const filtered = analyses
    .filter(a => !q || [a.patient_name, a.top_disease, a.top_disease && labels.disease(a.top_disease)]
      .some(v => searchable(v).includes(q)))
    .sort((a, b) => (URGENCY_RANK[a.urgency_level] ?? 9) - (URGENCY_RANK[b.urgency_level] ?? 9));

  const STATS = [
    { key: "total",     value: analyses.length,                                             Icon: Users },
    { key: "high",      value: analyses.filter(a => a.urgency_level === "high").length,      Icon: AlertTriangle },
    { key: "emergency", value: analyses.filter(a => a.urgency_level === "emergency").length, Icon: Zap },
  ];

  return (
    <div className="grid gap-4">
      <ConstellationStage caption={false} photo={PHOTOS.doctorDash}>
        <span className="pill pill-glass w-fit mb-4"><Stethoscope className="w-3.5 h-3.5" /> {t("doctor.portal")}</span>
        <h1 className="text-[clamp(1.9rem,3.4vw,2.6rem)] font-bold leading-[1.05]">{t("doctor.title", { name: withoutTitle(user?.full_name || "") })}</h1>
        <p className="text-white/85 text-[15.5px] mt-2">{t("doctor.subtitle")}</p>
      </ConstellationStage>

      <div className="grid grid-cols-3 gap-3.5">
        {STATS.map(({ key, value, Icon }) => (
          <StatTile key={key} label={t(`doctor.stats.${key}`)} value={loading ? null : value} icon={Icon}
            tone={key === "emergency" ? "bad" : key === "high" ? "serious" : "accent"} />
        ))}
      </div>

      <section className="card">
        <div className="card-head flex-wrap">
          <div className="card-icon"><Activity className="w-5 h-5" /></div>
          <h2 className="flex-1">{t("doctor.listTitle")}</h2>
          <div className="flex items-center gap-2 rounded-[14px] bg-panel2 px-3.5 py-2.5 w-[min(320px,100%)]">
            <Search className="w-4 h-4 text-dim shrink-0" />
            <input type="text" placeholder={t("doctor.searchPlaceholder")} aria-label={t("doctor.searchPlaceholder")}
              value={query} onChange={e => setQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-[15px] text-ink placeholder:text-dim" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted py-10">{t("doctor.empty")}</p>
        ) : (
          <div className="grid gap-2">
            {filtered.map(a => (
              <Link key={a.id} to={`/doctor/analysis/${a.id}`}
                className="group relative flex items-center gap-3.5 rounded-[20px] border border-line bg-panel pl-4 pr-3 py-2.5 transition-all hover:bg-raise hover:translate-x-1 overflow-hidden">
                {/* urgency stripe so emergencies stand out in a long list */}
                <span className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ background: `rgb(var(--${{ emergency: "bad", high: "serious", moderate: "warn", low: "good" }[a.urgency_level] || "good"}))` }} />
                <div className="w-10 h-10 rounded-xl grid place-items-center text-white text-[15px] font-bold shrink-0" style={{ background: "var(--hero)" }}>
                  {(a.patient_name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15.5px] font-semibold truncate">{a.patient_name || t("doctor.unknownPatient")}</div>
                  <div className="text-[13.5px] text-muted truncate">
                    {a.top_disease ? labels.disease(a.top_disease) : "—"} · {new Date(a.created_at).toLocaleDateString(dateLocale(), { dateStyle: "medium" })}
                  </div>
                </div>
                {a.has_comment && <span className="chip chip-accent"><MessageSquare className="w-3 h-3" /> {t("doctor.reviewed")}</span>}
                <UrgencyBadge level={a.urgency_level} />
                <ChevronRight className="w-4 h-4 text-dim group-hover:text-accent shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
