import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../LanguageSwitcher";
import ThemeSwitcher from "../ThemeSwitcher";
import Logo from "../ui/Logo";
import { Menu, X, User, LogOut, LayoutDashboard, Activity } from "lucide-react";

const NAV_LINKS = [
  { key: "home",        view: null },
  { key: "services",    view: "services" },
  { key: "specialties", view: "departments" },
  { key: "contact",     view: "contact" },
];

/** Top bar of the public pages, inside the frame. */
export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const currentView = new URLSearchParams(location.search).get("view");
  const goTo = (view) => { setOpen(false); navigate(view ? `/?view=${view}` : "/"); };
  const handleLogout = () => { logout(); navigate("/"); setOpen(false); };
  const dashboardPath = user?.role === "admin" ? "/admin" : user?.role === "doctor" ? "/doctor" : "/patient";
  const isActive = (view) => (view === null ? !currentView : currentView === view);

  const tabs = (
    NAV_LINKS.map(l => (
      <button key={l.key} onClick={() => goTo(l.view)} aria-current={isActive(l.view) ? "page" : undefined}
        className={`px-4 py-2 rounded-[10px] text-[14.5px] font-semibold transition-colors
          ${isActive(l.view) ? "bg-accent text-white shadow-glow" : "text-muted hover:text-ink"}`}>
        {t(`nav.${l.key}`)}
      </button>
    ))
  );

  return (
    <header className="sticky top-0 z-40 px-1 py-2">
      <div className="flex items-center gap-4">
        <button onClick={() => goTo(null)} aria-label={t("nav.home")}><Logo /></button>

        <nav className="hidden md:inline-flex items-center gap-1 p-1 rounded-[14px] bg-panel border border-line mx-auto">
          {tabs}
        </nav>

        <div className="hidden md:flex items-center gap-2.5 ml-auto md:ml-0">
          <LanguageSwitcher />
          <ThemeSwitcher />
          {user ? (
            <>
              <Link to={dashboardPath} className="btn-ghost btn-sm"><LayoutDashboard className="w-4 h-4" /> {t("common.dashboard")}</Link>
              <button onClick={handleLogout} className="btn-ghost btn-sm" aria-label={t("common.logout")}><LogOut className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm"><User className="w-4 h-4" /> {t("common.login")}</Link>
              <Link to="/register" className="btn-primary btn-sm"><Activity className="w-4 h-4" /> {t("nav.checkSymptoms")}</Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen(!open)} aria-label={open ? t("sidebar.closeMenu") : t("sidebar.openMenu")} aria-expanded={open}
          className="md:hidden ml-auto w-[42px] h-[42px] grid place-items-center rounded-full bg-panel border border-line text-ink">
          {open ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden mt-3 card !p-3 grid gap-1.5">
          <div className="grid gap-1">{tabs}</div>
          <div className="flex justify-center gap-2 py-1"><LanguageSwitcher /><ThemeSwitcher /></div>
          {user ? (
            <>
              <Link to={dashboardPath} onClick={() => setOpen(false)} className="btn-ghost"><LayoutDashboard className="w-4 h-4" /> {t("common.dashboard")}</Link>
              <button onClick={handleLogout} className="btn-ghost"><LogOut className="w-4 h-4" /> {t("common.logout")}</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="btn-ghost"><User className="w-4 h-4" /> {t("common.login")}</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary">{t("nav.checkSymptoms")}</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
