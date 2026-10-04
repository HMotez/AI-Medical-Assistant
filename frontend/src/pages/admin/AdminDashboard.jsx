import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";
import PageHead from "../../components/ui/PageHead";
import {
  Users, Activity, Cpu, RefreshCw, CheckCircle, AlertCircle, Loader2, Trash2, Shield,
  Search, Stethoscope, FileText, BarChart2, Microscope, ChevronRight, ChevronDown, UserCheck
} from "lucide-react";
import StatTile from "../../components/ui/StatTile";

const ROLES = ["patient", "doctor", "admin"];

function RoleDropdown({ userId, currentRole, onChanged, isSelf }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (isSelf) {
    return <span className="chip chip-accent">{t("admin.dashboard.you", { role: t(`common.roles.${currentRole}`) })}</span>;
  }

  const change = async (newRole) => {
    if (newRole === currentRole) { setOpen(false); return; }
    setBusy(true);
    try {
      const { data } = await axiosClient.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      onChanged(data);
    } catch { /* role unchanged on failure */ }
    finally { setBusy(false); setOpen(false); }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} disabled={busy} aria-label={t("admin.dashboard.changeRole")} aria-expanded={open}
        className="chip chip-accent hover:brightness-95">
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : t(`common.roles.${currentRole}`)}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 min-w-[130px] rounded-2xl bg-panel border border-line shadow-elev2 p-1.5">
          {ROLES.map(r => (
            <button key={r} onClick={() => change(r)}
              className={`w-full text-left px-3 py-2 rounded-xl text-[14.5px] font-semibold transition-colors
                ${r === currentRole ? "bg-accent/12 text-accent" : "text-ink hover:bg-panel2"}`}>
              {t(`common.roles.${r}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [loadingStats, setLS]   = useState(true);
  const [loadingUsers, setLU]   = useState(true);
  const [retraining, setRet]    = useState(false);
  const [retMsg, setRetMsg]     = useState("");
  const [query, setQuery]       = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    axiosClient.get("/api/admin/stats").then(r => setStats(r.data)).finally(() => setLS(false));
    axiosClient.get("/api/users/").then(r => setUsers(r.data)).finally(() => setLU(false));
  }, []);

  const retrain = async () => {
    setRet(true); setRetMsg("");
    try { await axiosClient.post("/api/admin/retrain"); setRetMsg("success"); }
    catch { setRetMsg("error"); }
    finally { setRet(false); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm(t("admin.dashboard.confirmDelete"))) return;
    setDeleting(id);
    try {
      await axiosClient.delete(`/api/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } finally { setDeleting(null); }
  };

  const updateUserRole = (updated) =>
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, role: updated.role } : u));

  const q = query.toLowerCase();
  const filtered = users.filter(u => !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));

  const STAT_CARDS = [
    { key: "users",    value: stats?.total_users,    Icon: Users },
    { key: "analyses", value: stats?.total_analyses, Icon: Activity },
    { key: "doctors",  value: stats?.total_doctors,  Icon: Stethoscope },
    { key: "reports",  value: stats?.total_reports,  Icon: FileText },
  ];

  return (
    <div className="grid gap-4">
      <PageHead eyebrow={t("admin.administration")} title={t("admin.dashboard.title")} subtitle={user?.email} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
        {STAT_CARDS.map(({ key, value, Icon }) => (
          <StatTile key={key} label={t(`admin.dashboard.cards.${key}`)} value={loadingStats ? null : value} icon={Icon} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          { to: "/admin/stats",    Icon: BarChart2,  title: t("admin.dashboard.statsLink.title"),    sub: t("admin.dashboard.statsLink.sub") },
          { to: "/admin/diseases", Icon: Microscope, title: t("admin.dashboard.diseasesLink.title"), sub: t("admin.dashboard.diseasesLink.sub", { diseases: 41, symptoms: 131 }) },
        ].map(({ to, Icon, title, sub }) => (
          <Link key={to} to={to} className="card group flex items-center gap-4 hover:-translate-y-0.5">
            <div className="card-icon"><Icon className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0"><div className="font-display font-bold">{title}</div><div className="text-[14px] text-muted">{sub}</div></div>
            <ChevronRight className="w-4 h-4 text-dim group-hover:text-accent" />
          </Link>
        ))}
      </div>

      <section className="card flex flex-wrap items-center gap-4">
        <div className="card-icon"><Cpu className="w-5 h-5" /></div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-[17px] font-bold">{t("admin.dashboard.retrainTitle")}</h2>
          <p className="text-muted text-[14px]">{t("admin.dashboard.retrainText")}</p>
        </div>
        {retMsg === "success" && <span className="alert-success !py-2"><CheckCircle className="w-4 h-4" /> {t("admin.dashboard.retrainStarted")}</span>}
        {retMsg === "error" && <span className="alert-error !py-2"><AlertCircle className="w-4 h-4" /> {t("admin.dashboard.retrainFailed")}</span>}
        <button onClick={retrain} disabled={retraining} className="btn-primary">
          {retraining ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {t("admin.dashboard.retrain")}
        </button>
      </section>

      <section className="card">
        <div className="card-head flex-wrap">
          <div className="card-icon"><Users className="w-5 h-5" /></div>
          <div className="flex-1 min-w-0">
            <h2>{t("admin.dashboard.users")} <span className="chip ml-1">{users.length}</span></h2>
            <small className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> {t("admin.dashboard.roleHint")}</small>
          </div>
          <div className="flex items-center gap-2 rounded-[14px] bg-panel2 px-3.5 py-2.5 w-[min(300px,100%)]">
            <Search className="w-4 h-4 text-dim shrink-0" />
            <input type="text" placeholder={t("admin.dashboard.searchPlaceholder")} aria-label={t("admin.dashboard.searchPlaceholder")}
              value={query} onChange={e => setQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-[15px] text-ink placeholder:text-dim" />
          </div>
        </div>

        {loadingUsers ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted py-10">{t("admin.dashboard.noUsers")}</p>
        ) : (
          <div className="grid gap-2">
            {filtered.map(u => (
              <div key={u.id} className="flex items-center gap-3.5 rounded-[20px] border border-line bg-panel px-3 py-2.5">
                <div className="w-10 h-10 rounded-xl grid place-items-center text-white text-[15px] font-bold shrink-0" style={{ background: "var(--hero)" }}>
                  {(u.full_name || u.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15.5px] font-semibold truncate">{u.full_name || "—"}</div>
                  <div className="text-[13.5px] text-muted truncate">{u.email}</div>
                </div>
                <RoleDropdown userId={u.id} currentRole={u.role} onChanged={updateUserRole} isSelf={u.id === user?.id} />
                <button onClick={() => deleteUser(u.id)} disabled={deleting === u.id || u.role === "admin"}
                  title={u.role === "admin" ? t("admin.dashboard.cannotDeleteAdmin") : t("admin.dashboard.deleteUser")}
                  aria-label={u.role === "admin" ? t("admin.dashboard.cannotDeleteAdmin") : t("admin.dashboard.deleteUser")}
                  className="w-9 h-9 rounded-xl grid place-items-center text-dim hover:text-bad hover:bg-bad/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-dim">
                  {deleting === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <div className="card-icon"><Shield className="w-5 h-5" /></div>
          <h2>{t("admin.dashboard.guide")}</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3.5">
          {ROLES.map(role => (
            <div key={role} className="rounded-[20px] bg-panel2 p-5">
              <span className="chip chip-accent">{t(`common.roles.${role}`)}</span>
              <ul className="grid gap-1.5 my-4">
                {t(`admin.dashboard.roles.${role}.access`, { returnObjects: true }).map(a => (
                  <li key={a} className="flex items-center gap-2 text-[14.5px]"><CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" /> {a}</li>
                ))}
              </ul>
              <p className="text-[13.5px] text-muted border-t border-line pt-3">
                <strong className="text-ink">{t("admin.dashboard.loginLabel")}</strong> {t(`admin.dashboard.roles.${role}.login`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
