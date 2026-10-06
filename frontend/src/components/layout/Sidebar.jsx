import { useEffect, useLayoutEffect, useRef, useState } from "react";
import axiosClient from "../../api/axiosClient";
import Avatar from "../ui/Avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../LanguageSwitcher";
import ThemeSwitcher from "../ThemeSwitcher";
import Logo from "../ui/Logo";
import {
  LayoutDashboard, Activity, ClipboardList, User, LogOut, BarChart2,
  Microscope, Shield, MessageSquare, TrendingUp, X, BadgeCheck
} from "lucide-react";

const NAV = {
  patient: [
    { icon: LayoutDashboard, key: "patient.dashboard",      to: "/patient" },
    { icon: Activity,        key: "patient.symptomChecker", to: "/patient/analyze" },
    { icon: ClipboardList,   key: "patient.history",        to: "/patient/history" },
    { icon: TrendingUp,      key: "patient.trends",         to: "/patient/trends" },
    { icon: MessageSquare,   key: "patient.chat",           to: "/patient/chat" },
    { icon: User,            key: "patient.profile",        to: "/patient/profile" },
  ],
  doctor: [
    { icon: LayoutDashboard, key: "doctor.dashboard",       to: "/doctor" },
    { icon: User,            key: "doctor.profile",         to: "/doctor/profile" },
  ],
  admin: [
    { icon: LayoutDashboard, key: "admin.dashboard",        to: "/admin" },
    { icon: BarChart2,       key: "admin.stats",            to: "/admin/stats" },
    { icon: Microscope,      key: "admin.diseases",         to: "/admin/diseases" },
    { icon: BadgeCheck,      key: "admin.verifications",    to: "/admin/verifications", badge: "pending" },
    { icon: User,            key: "admin.profile",          to: "/admin/profile" },
  ],
};

/** Sidebar inside the app frame. On small screens it is a drawer (open / onClose). */
export default function Sidebar({ open = false, onClose = () => {} }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const items = NAV[user?.role] || [];

  const isActive = (to) =>
    ["/patient", "/doctor", "/admin"].includes(to)
      ? location.pathname === to
      : location.pathname.startsWith(to);

  const handleLogout = () => { logout(); navigate("/"); };

  // Admin: how many doctor applications wait for review
  const [pending, setPending] = useState(0);
  useEffect(() => {
    if (user?.role !== "admin") return undefined;
    const load = () => axiosClient.get("/api/admin/doctor-requests").then(r => setPending(r.data.length)).catch(() => {});
    load();
    window.addEventListener("verifications-changed", load);
    return () => window.removeEventListener("verifications-changed", load);
  }, [user?.role, location.pathname]);

  // One highlight that slides to the active item when the page changes
  const navRef = useRef(null);
  const [marker, setMarker] = useState(null);
  useLayoutEffect(() => {
    const el = navRef.current?.querySelector('[aria-current="page"]');
    setMarker(el ? { top: el.offsetTop, height: el.offsetHeight } : null);
  }, [location.pathname, items.length, t]);

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="lg:hidden fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm" onClick={onClose} />}

      <aside
        className={`flex flex-col px-3.5 pt-5 pb-4 min-h-0
          max-lg:fixed max-lg:inset-y-3 max-lg:left-3 max-lg:z-50 max-lg:w-[250px] max-lg:rounded-card max-lg:bg-frame max-lg:shadow-elev2
          max-lg:transition-transform max-lg:duration-300 ${open ? "max-lg:translate-x-0" : "max-lg:-translate-x-[110%]"}`}
        aria-label={t("sidebar.mainMenu")}>

        <div className="flex items-center justify-between px-2 pb-5">
          <Link to="/" onClick={onClose}><Logo /></Link>
          <button className="lg:hidden w-9 h-9 grid place-items-center rounded-xl text-muted hover:bg-panel2"
            onClick={onClose} aria-label={t("sidebar.closeMenu")}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav ref={navRef} className="relative flex-1 overflow-y-auto">
          {marker && (
            <span aria-hidden="true" className="absolute left-0 right-0 rounded-xl pointer-events-none"
              style={{
                top: marker.top, height: marker.height,
                background: "linear-gradient(90deg, rgb(var(--accent) / 0.2), rgb(var(--accent) / 0.05))",
                transition: "top .45s cubic-bezier(.16,1,.3,1), height .45s cubic-bezier(.16,1,.3,1)",
              }}>
              <span className="absolute left-[-2px] top-2.5 bottom-2.5 w-[3px] rounded bg-accent" style={{ boxShadow: "0 0 12px var(--glow)" }} />
            </span>
          )}
          <p className="flex items-center gap-2.5 px-3 pt-1.5 pb-2 text-[12.5px] uppercase tracking-[0.22em] text-dim">
            <span className="text-accent font-bold">+</span>{t("sidebar.mainMenu")}
          </p>
          {items.map(({ icon: Icon, key, to, badge }) => {
            const active = isActive(to);
            return (
              <Link key={to} to={to} onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3.5 my-0.5 px-3.5 py-3 rounded-xl text-[16px] transition-colors
                  ${active ? "text-ink font-semibold" : "text-muted font-medium hover:text-ink"}`}>
                <Icon className={`relative w-[18px] h-[18px] shrink-0 ${active ? "text-accent" : ""}`}
                  style={active ? { filter: "drop-shadow(0 0 6px var(--glow))" } : undefined} />
                <span className="relative transition-transform group-hover:translate-x-[3px]">{t(`sidebar.${key}`)}</span>
                {badge && pending > 0 && (
                  <span className="relative ml-auto min-w-[22px] h-[22px] px-1.5 rounded-full grid place-items-center bg-bad text-white text-[12px] font-bold"
                    aria-label={t("adminVerify.pendingCount", { count: pending })}>{pending}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="grid gap-2.5 mt-4">
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="flex-1 justify-center" />
            <ThemeSwitcher />
          </div>
          <Link to={`/${user?.role || "patient"}/profile`} onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-2xl bg-panel border border-line hover:border-accent/40 transition-colors">
            <Avatar user={user} size={38} />
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-semibold text-ink truncate">{user?.full_name || t("common.user")}</div>
              <span className="chip chip-accent !px-2 !py-0.5 !text-[12px] mt-0.5">
                {user?.role === "admin" && <Shield className="w-2.5 h-2.5" />}
                {user?.role && t(`common.roles.${user.role}`)}
              </span>
            </div>
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[15px] font-semibold text-muted hover:text-bad hover:bg-bad/10 transition-colors">
            <LogOut className="w-4 h-4" /> {t("common.signOut")}
          </button>
        </div>
      </aside>
    </>
  );
}
