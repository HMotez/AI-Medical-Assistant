import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Stethoscope, LayoutDashboard, Activity, ClipboardList,
  User, LogOut, BarChart2, Microscope, Menu, X,
  ChevronRight, Shield, MessageSquare, TrendingUp
} from "lucide-react";

const NAV = {
  patient: [
    { icon: LayoutDashboard, label: "Dashboard",       to: "/patient" },
    { icon: Activity,        label: "Symptom Checker", to: "/patient/analyze" },
    { icon: ClipboardList,   label: "My History",      to: "/patient/history" },
    { icon: TrendingUp,      label: "Health Trends",   to: "/patient/trends" },
    { icon: MessageSquare,   label: "MedAI Chat",      to: "/patient/chat" },
    { icon: User,            label: "My Profile",      to: "/patient/profile" },
  ],
  doctor: [
    { icon: LayoutDashboard, label: "Dashboard",       to: "/doctor" },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Dashboard",       to: "/admin" },
    { icon: BarChart2,       label: "Statistics",      to: "/admin/stats" },
    { icon: Microscope,      label: "Diseases",        to: "/admin/diseases" },
  ],
};

const ROLE_BADGE = {
  patient: { label: "Patient",    bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  doctor:  { label: "Doctor",     bg: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  admin:   { label: "Admin",      bg: "bg-red-500/20 text-red-300 border-red-500/30" },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);

  const items = NAV[user?.role] || [];
  const badge = ROLE_BADGE[user?.role] || {};

  const handleLogout = () => { logout(); navigate("/"); };

  const isActive = (to) =>
    to === "/patient" || to === "/doctor" || to === "/admin"
      ? location.pathname === to
      : location.pathname.startsWith(to);

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(180deg, #0a0f1e 0%, #0d2233 60%, #0a1a2a 100%)" }}>

      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-white font-black text-sm tracking-wide">AI MEDICAL</div>
            <div className="text-teal-400/70 text-[10px] font-semibold uppercase tracking-widest">Assistant</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-black text-white/25 uppercase tracking-widest px-3 mb-3">Main Menu</p>
        {items.map(({ icon: Icon, label, to }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 relative
                ${active
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "text-white/50 hover:text-white hover:bg-white/8 border border-transparent"
                }`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-teal-400 rounded-full" />
              )}
              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-teal-400" : "text-white/40 group-hover:text-white/70"}`} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-teal-400/60" />}
            </Link>
          );
        })}
      </nav>

      {/* User card + logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-3 px-3 py-3 bg-white/5 rounded-xl border border-white/10">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0">
            {(user?.full_name || user?.email || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-xs truncate">{user?.full_name || "User"}</div>
            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md border mt-0.5 ${badge.bg}`}>
              {user?.role === "admin" && <Shield className="w-2.5 h-2.5" />}
              {badge.label}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg border border-white/10"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 h-full flex flex-col">
            <SidebarContent />
          </div>
          {/* Close overlay */}
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
