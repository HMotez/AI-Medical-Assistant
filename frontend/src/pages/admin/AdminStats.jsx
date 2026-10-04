import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import PageHead from "../../components/ui/PageHead";
import useChartTip from "../../components/charts/useChartTip";
import {
  Activity, Users, Stethoscope, FileText, TrendingUp, AlertTriangle, Zap, CheckCircle, AlertCircle, Loader2, HeartPulse
} from "lucide-react";
import StatTile from "../../components/ui/StatTile";

/** Horizontal bars on one scale; values at the tip, tooltip on hover. */
function Bars({ rows, max }) {
  const { bind, node } = useChartTip();
  return (
    <div className="grid gap-3.5">
      {rows.map(({ key, label, value, color, Icon }) => {
        const width = max > 0 ? `${Math.max((value / max) * 100, value > 0 ? 2 : 0)}%` : "0%";
        return (
          <div key={key} className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] gap-3 items-center text-[15px]">
            <span className="flex items-center gap-2 min-w-0">
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />}
              <span className="truncate">{label}</span>
            </span>
            <div className="relative h-[18px]">
              <div className="absolute -inset-y-1.5 inset-x-0 pointer-events-none"
                style={{ background: "linear-gradient(90deg, var(--chart-grid) 1px, transparent 1px) 0 0 / 25% 100%", borderRight: "1px solid var(--chart-grid)" }} />
              <div className="absolute inset-y-0 left-0 rounded-r" style={{ width, background: color }} />
              <span className="font-data absolute top-1/2 -translate-y-1/2 text-[13.5px] text-ink" style={{ left: `calc(${width} + 8px)` }}>{value}</span>
              <div className="absolute -inset-y-1.5 inset-x-0" {...bind(<><b>{label}</b><br />{value}</>)} />
            </div>
          </div>
        );
      })}
      {node}
    </div>
  );
}

export default function AdminStats() {
  const { t } = useTranslation();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get("/api/admin/stats").then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;

  // Urgency uses the status colors, always with icon + word
  const urgencyRows = [
    { key: "emergency", value: stats?.urgency_emergency ?? 0, color: "rgb(var(--bad))",     Icon: Zap },
    { key: "high",      value: stats?.urgency_high      ?? 0, color: "rgb(var(--serious))", Icon: AlertTriangle },
    { key: "moderate",  value: stats?.urgency_moderate  ?? 0, color: "rgb(var(--warn))",    Icon: AlertCircle },
    { key: "low",       value: stats?.urgency_low       ?? 0, color: "rgb(var(--good))",    Icon: CheckCircle },
  ].map(r => ({ ...r, label: t(`common.urgency.${r.key}`) }));

  // Roles: one series, one hue
  const roleRows = [
    { key: "patient", value: stats?.total_patients ?? 0 },
    { key: "doctor",  value: stats?.total_doctors  ?? 0 },
    { key: "admin",   value: stats?.total_admins   ?? 0 },
  ].map(r => ({ ...r, color: "var(--chart-series)", label: t(`admin.stats.rolesPlural.${r.key}`) }));

  const pct = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "0%");
  const health = [
    { key: "avg",           value: stats?.total_patients > 0 ? ((stats.total_analyses || 0) / stats.total_patients).toFixed(1) : "0" },
    { key: "reportRate",    value: pct(stats?.total_reports || 0, stats?.total_analyses || 0) },
    { key: "emergencyRate", value: pct(stats?.urgency_emergency || 0, stats?.total_analyses || 0) },
    { key: "coverage",      value: stats?.total_doctors > 0 && stats?.total_patients > 0 ? `1:${Math.round(stats.total_patients / stats.total_doctors)}` : t("admin.stats.na") },
  ];

  const KPIS = [
    { key: "users",    value: stats?.total_users,    Icon: Users },
    { key: "analyses", value: stats?.total_analyses, Icon: Activity },
    { key: "doctors",  value: stats?.total_doctors,  Icon: Stethoscope },
    { key: "reports",  value: stats?.total_reports,  Icon: FileText },
  ];

  return (
    <div className="grid gap-4">
      <PageHead eyebrow={t("admin.administration")} title={t("admin.stats.title")} subtitle={t("admin.stats.subtitle")} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
        {KPIS.map(({ key, value, Icon }) => (
          <StatTile key={key} label={t(`admin.stats.cards.${key}.label`)} value={value} icon={Icon}
            caption={t(`admin.stats.cards.${key}.sub`)} />
        ))}
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <section className="card">
          <div className="card-head">
            <div className="card-icon"><TrendingUp className="w-5 h-5" /></div>
            <div><h2>{t("admin.stats.urgencyTitle")}</h2><small>{t("admin.stats.urgencyText")}</small></div>
          </div>
          <Bars rows={urgencyRows} max={Math.max(...urgencyRows.map(r => r.value), 1)} />
          <div className="flex justify-between items-center mt-5 pt-4 border-t border-line text-[14.5px]">
            <span className="text-muted">{t("admin.stats.totalAnalyses")}</span>
            <span className="font-data">{stats?.total_analyses ?? 0}</span>
          </div>
        </section>
        <section className="card">
          <div className="card-head">
            <div className="card-icon"><Users className="w-5 h-5" /></div>
            <div><h2>{t("admin.stats.rolesTitle")}</h2><small>{t("admin.stats.rolesText")}</small></div>
          </div>
          <Bars rows={roleRows} max={Math.max(...roleRows.map(r => r.value), 1)} />
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <div className="card-icon"><HeartPulse className="w-5 h-5" /></div>
          <h2>{t("admin.stats.health")}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {health.map(({ key, value }) => (
            <div key={key} className="rounded-[20px] bg-panel2 p-4">
              <div className="font-display text-[25.5px] font-extrabold tabular-nums">{value}</div>
              <div className="text-[13.5px] text-muted">{t(`admin.stats.healthItems.${key}`)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
