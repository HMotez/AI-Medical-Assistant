import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Users, Activity, Cpu, RefreshCw,
  CheckCircle, AlertCircle, Loader2, Trash2, Shield,
  Search, Stethoscope, FileText, BarChart2, Microscope,
  ChevronRight, ChevronDown, UserCheck
} from "lucide-react";

const ROLE_GLASS = {
  admin:   "bg-red-500/20 text-red-300 border border-red-400/30",
  doctor:  "bg-blue-500/20 text-blue-300 border border-blue-400/30",
  patient: "bg-green-500/20 text-green-300 border border-green-400/30",
};

const ROLES = ["patient", "doctor", "admin"];

function RoleDropdown({ userId, currentRole, onChanged, isSelf }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (isSelf) {
    return (
      <span className={`text-xs font-black px-3 py-1.5 rounded-full ${ROLE_GLASS[currentRole]}`}>
        {t("admin.dashboard.you", { role: t(`common.roles.${currentRole}`) })}
      </span>
    );
  }

  const change = async (newRole) => {
    if (newRole === currentRole) { setOpen(false); return; }
    setBusy(true);
    try {
      const { data } = await axiosClient.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      onChanged(data);
    } catch { /* silently ignore */ }
    finally { setBusy(false); setOpen(false); }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        aria-label={t("admin.dashboard.changeRole")}
        aria-expanded={open}
        className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full transition-all hover:opacity-80 ${ROLE_GLASS[currentRole]}`}
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : t(`common.roles.${currentRole}`)}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-10 bg-gray-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden min-w-[110px]">
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => change(r)}
              className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors
                ${r === currentRole ? "text-teal-300 bg-teal-500/20" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
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

  const updateUserRole = (updated) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, role: updated.role } : u));
  };

  const filtered = users.filter(u =>
    !query ||
    u.full_name?.toLowerCase().includes(query.toLowerCase()) ||
    u.email?.toLowerCase().includes(query.toLowerCase())
  );

  const STAT_CARDS = [
    { key: "users",    value: stats?.total_users,    Icon: Users,       gradient: "from-blue-500 to-blue-700" },
    { key: "analyses", value: stats?.total_analyses, Icon: Activity,    gradient: "from-teal-500 to-teal-700" },
    { key: "doctors",  value: stats?.total_doctors,  Icon: Stethoscope, gradient: "from-purple-500 to-purple-700" },
    { key: "reports",  value: stats?.total_reports,  Icon: FileText,    gradient: "from-green-500 to-green-700" },
  ];

  return (
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/25">
          <LayoutDashboard className="w-8 h-8 text-white" />
        </div>
        <div>
          <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">{t("admin.administration")}</p>
          <h1 className="text-3xl font-black text-white">{t("admin.dashboard.title")}</h1>
          <p className="text-white/50 text-sm mt-1">{user?.email}</p>
        </div>
      </div>

      <div className="max-w-6xl space-y-6">

        {/* Quick nav */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/admin/stats"
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex items-center gap-4 hover:border-teal-400/40 hover:bg-white/15 transition-all group hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart2 className="w-6 h-6 text-teal-300" />
            </div>
            <div className="flex-1">
              <div className="font-black text-white">{t("admin.dashboard.statsLink.title")}</div>
              <div className="text-xs text-white/40 mt-0.5">{t("admin.dashboard.statsLink.sub")}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-teal-300" />
          </Link>
          <Link to="/admin/diseases"
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex items-center gap-4 hover:border-blue-400/40 hover:bg-white/15 transition-all group hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Microscope className="w-6 h-6 text-blue-300" />
            </div>
            <div className="flex-1">
              <div className="font-black text-white">{t("admin.dashboard.diseasesLink.title")}</div>
              <div className="text-xs text-white/40 mt-0.5">{t("admin.dashboard.diseasesLink.sub", { diseases: 41, symptoms: 131 })}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-blue-300" />
          </Link>
        </div>

        {/* Stats */}
        {loadingStats ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-teal-400 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STAT_CARDS.map(({ key, value, Icon, gradient }) => (
              <div key={key} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform">
                <div className={`bg-gradient-to-r ${gradient} px-5 py-4 flex items-center gap-3`}>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/85 text-xs font-black uppercase tracking-wide">{t(`admin.dashboard.cards.${key}`)}</span>
                </div>
                <div className="px-5 py-4">
                  <div className="text-4xl font-black text-white">{value ?? "—"}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Retrain */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-md">
                <Cpu className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-black text-white text-lg">{t("admin.dashboard.retrainTitle")}</h2>
                <p className="text-sm text-white/50 mt-0.5">{t("admin.dashboard.retrainText")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {retMsg === "success" && (
                <div className="flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 text-sm px-4 py-2 rounded-xl">
                  <CheckCircle className="w-4 h-4" /> {t("admin.dashboard.retrainStarted")}
                </div>
              )}
              {retMsg === "error" && (
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 text-red-300 text-sm px-4 py-2 rounded-xl">
                  <AlertCircle className="w-4 h-4" /> {t("admin.dashboard.retrainFailed")}
                </div>
              )}
              <button onClick={retrain} disabled={retraining} className="btn-primary gap-2 disabled:opacity-60">
                {retraining ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {t("admin.dashboard.retrain")}
              </button>
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <h2 className="font-black text-white text-lg flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-teal-400" /> {t("admin.dashboard.users")}
              <span className="text-xs font-bold text-white/40 bg-white/10 px-2.5 py-1 rounded-full">{users.length}</span>
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input type="text" placeholder={t("admin.dashboard.searchPlaceholder")} aria-label={t("admin.dashboard.searchPlaceholder")}
                  value={query} onChange={e => setQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all" />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/40 font-semibold shrink-0">
                <UserCheck className="w-4 h-4" /> {t("admin.dashboard.roleHint")}
              </div>
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-teal-400 animate-spin" /></div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <p className="text-center font-bold text-white/40 py-10">{t("admin.dashboard.noUsers")}</p>
              ) : filtered.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/8 group transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-black shrink-0">
                    {(u.full_name || u.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm">{u.full_name || "—"}</div>
                    <div className="text-xs text-white/40 mt-0.5">{u.email}</div>
                  </div>
                  <RoleDropdown
                    userId={u.id}
                    currentRole={u.role}
                    onChanged={updateUserRole}
                    isSelf={u.id === user?.id}
                  />
                  <button
                    onClick={() => deleteUser(u.id)}
                    disabled={deleting === u.id || u.role === "admin"}
                    title={u.role === "admin" ? t("admin.dashboard.cannotDeleteAdmin") : t("admin.dashboard.deleteUser")}
                    aria-label={u.role === "admin" ? t("admin.dashboard.cannotDeleteAdmin") : t("admin.dashboard.deleteUser")}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/20 disabled:opacity-20 transition-all opacity-0 group-hover:opacity-100">
                    {deleting === u.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role guide */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="font-black text-white text-base mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-white/60" /> {t("admin.dashboard.guide")}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { role: "patient", glass: "bg-green-500/10 border-green-400/25", badge: "bg-green-500/20 text-green-300 border-green-400/30" },
              { role: "doctor",  glass: "bg-blue-500/10 border-blue-400/25",   badge: "bg-blue-500/20 text-blue-300 border-blue-400/30" },
              { role: "admin",   glass: "bg-red-500/10 border-red-400/25",     badge: "bg-red-500/20 text-red-300 border-red-400/30" },
            ].map(({ role, glass, badge }) => (
              <div key={role} className={`border ${glass} rounded-2xl p-5`}>
                <div className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border mb-3 ${badge}`}>
                  {t(`common.roles.${role}`)}
                </div>
                <ul className="space-y-1.5 mb-4">
                  {t(`admin.dashboard.roles.${role}.access`, { returnObjects: true }).map(a => (
                    <li key={a} className="flex items-center gap-2 text-xs text-white/60 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" /> {a}
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-white/30 font-semibold border-t border-white/10 pt-3">
                  <span className="font-black text-white/50">{t("admin.dashboard.loginLabel")} </span>{t(`admin.dashboard.roles.${role}.login`)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
