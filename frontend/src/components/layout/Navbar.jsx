import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../LanguageSwitcher";
import { Stethoscope, Menu, X, User, LogOut, LayoutDashboard, Activity } from "lucide-react";

const NAV_LINKS = [
  { key: "home",        view: null },
  { key: "services",    view: "services" },
  { key: "specialties", view: "departments" },
  { key: "contact",     view: "contact" },
];

/* 3-D tilt card hook */
function use3DTilt(strength = 12) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;
    const y = (e.clientY - top)  / height - 0.5;
    el.style.transform = `perspective(400px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) translateZ(6px)`;
  };
  const onLeave = () => {
    if (ref.current)
      ref.current.style.transform = "perspective(400px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  };
  return { ref, onMouseMove: onMove, onMouseLeave: onLeave };
}

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);
  const logoTilt  = use3DTilt(18);

  const currentView = new URLSearchParams(location.search).get("view");
  const goTo = (view) => { setOpen(false); navigate(view ? `/?view=${view}` : "/"); };
  const handleLogout = () => { logout(); navigate("/"); setOpen(false); };
  const dashboardPath = user?.role === "admin" ? "/admin" : user?.role === "doctor" ? "/doctor" : "/patient";
  const isActive = (view) => (view === null ? !currentView : currentView === view);

  return (
    <>
      {/* ─── Keyframes injected once ─────────────────────────────── */}
      <style>{`
        @keyframes navGlow {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes logoSpin {
          0%   { transform: rotateY(0deg)   scale(1); }
          50%  { transform: rotateY(180deg) scale(1.15); }
          100% { transform: rotateY(360deg) scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0   rgba(20,184,166,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(20,184,166,0);   }
          100% { box-shadow: 0 0 0 0   rgba(20,184,166,0);   }
        }
        .nav-link-3d {
          transition: transform 0.2s ease, color 0.2s ease, background 0.2s ease;
          transform-style: preserve-3d;
          transform: perspective(300px) rotateX(0deg) translateZ(0px);
        }
        .nav-link-3d:hover:not(.active-link) {
          transform: perspective(300px) rotateX(-8deg) translateZ(8px);
          color: #0d9488;
        }
        .active-link {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(20,184,166,0.45), 0 0 0 1px rgba(255,255,255,0.15) inset;
          transform: perspective(300px) translateZ(4px);
        }
        .cta-3d {
          position: relative;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          transform: perspective(300px) translateZ(0px);
          box-shadow: 0 4px 0 #0f766e, 0 6px 20px rgba(20,184,166,0.35);
        }
        .cta-3d:hover {
          transform: perspective(300px) translateZ(4px) translateY(-2px);
          box-shadow: 0 6px 0 #0f766e, 0 10px 28px rgba(20,184,166,0.45);
        }
        .cta-3d:active {
          transform: perspective(300px) translateZ(0px) translateY(2px);
          box-shadow: 0 2px 0 #0f766e, 0 4px 12px rgba(20,184,166,0.25);
        }
        .logo-icon {
          transition: transform 0.6s cubic-bezier(0.34,1.56,0.64,1);
          transform-style: preserve-3d;
        }
        .logo-wrap:hover .logo-icon {
          animation: logoSpin 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .nav-bar {
          animation: slideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }
      `}</style>

      <nav
        className="nav-bar sticky top-0 z-50"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,255,254,0.98) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: "0 1px 0 rgba(20,184,166,0.12), 0 4px 24px rgba(0,0,0,0.06)",
          borderBottom: "1.5px solid rgba(20,184,166,0.15)",
        }}
      >
        {/* Animated top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent 0%, #14b8a6 30%, #06b6d4 50%, #14b8a6 70%, transparent 100%)",
          backgroundSize: "200% auto",
          animation: "shimmer 3s linear infinite",
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <button
              onClick={() => goTo(null)}
              className="logo-wrap flex items-center gap-2.5 shrink-0"
              style={{ perspective: "600px" }}
              {...logoTilt}
            >
              <div
                className="logo-icon w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 60%, #0891b2 100%)",
                  boxShadow: "0 4px 12px rgba(20,184,166,0.4), 0 0 0 1px rgba(255,255,255,0.2) inset, inset 0 -3px 6px rgba(0,0,0,0.15)",
                }}
              >
                <Stethoscope className="w-5 h-5 text-white drop-shadow" />
              </div>
              <div className="leading-tight">
                <div
                  className="text-base font-black tracking-wide"
                  style={{
                    background: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("common.brand")}
                </div>
                <div className="text-[10px] text-gray-400 font-medium -mt-0.5 uppercase tracking-widest">{t("common.brandSub")}</div>
              </div>
            </button>

            {/* ── Desktop nav links ── */}
            <div className="hidden md:flex items-center gap-1" style={{ perspective: "800px" }}>
              {NAV_LINKS.map(l => (
                <button
                  key={l.key}
                  onClick={() => goTo(l.view)}
                  className={`nav-link-3d text-sm font-semibold px-5 py-2 rounded-full ${isActive(l.view) ? "active-link" : "text-gray-600"}`}
                >
                  {t(`nav.${l.key}`)}
                </button>
              ))}
            </div>

            {/* ── Desktop right ── */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />
              {user ? (
                <>
                  <span
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, rgba(20,184,166,0.1) 0%, rgba(8,145,178,0.1) 100%)",
                      color: "#0d9488",
                      border: "1px solid rgba(20,184,166,0.25)",
                    }}
                  >
                    {user.full_name?.split(" ")[0]}
                  </span>
                  <Link to={dashboardPath}
                    className="nav-link-3d flex items-center gap-1.5 text-teal-700 font-bold text-sm px-4 py-2 rounded-full"
                    style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)" }}>
                    <LayoutDashboard className="w-4 h-4" /> {t("common.dashboard")}
                  </Link>
                  <button onClick={handleLogout}
                    className="nav-link-3d flex items-center gap-1.5 text-gray-500 font-semibold text-sm px-4 py-2 rounded-full"
                    style={{ border: "1.5px solid #e5e7eb" }}>
                    <LogOut className="w-4 h-4" /> {t("common.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login"
                    className="nav-link-3d flex items-center gap-1.5 text-sm font-semibold text-gray-600 px-4 py-2 rounded-full"
                    style={{ border: "1.5px solid #e5e7eb" }}>
                    <User className="w-4 h-4" /> {t("common.login")}
                  </Link>
                  <Link to="/register"
                    className="cta-3d inline-flex items-center gap-1.5 text-white font-black text-sm px-6 py-2.5 rounded-full"
                    style={{ background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)" }}>
                    <Activity className="w-4 h-4" /> {t("nav.checkSymptoms")}
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? t("sidebar.closeMenu") : t("sidebar.openMenu")}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl transition-all"
              style={{
                background: open ? "rgba(20,184,166,0.12)" : "rgba(0,0,0,0.03)",
                border: "1.5px solid",
                borderColor: open ? "rgba(20,184,166,0.4)" : "#e5e7eb",
                color: open ? "#0d9488" : "#6b7280",
                transform: open ? "rotate(90deg)" : "rotate(0deg)",
                transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {open && (
          <div
            className="md:hidden px-4 py-4 space-y-1"
            style={{
              borderTop: "1px solid rgba(20,184,166,0.12)",
              background: "rgba(255,255,255,0.99)",
              animation: "slideIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            {NAV_LINKS.map((l, i) => (
              <button key={l.key} onClick={() => goTo(l.view)}
                className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  animationDelay: `${i * 50}ms`,
                  background: isActive(l.view) ? "linear-gradient(135deg, #14b8a6, #0d9488)" : "transparent",
                  color: isActive(l.view) ? "white" : "#374151",
                }}>
                {t(`nav.${l.key}`)}
              </button>
            ))}
            <div className="pt-3 space-y-2 border-t" style={{ borderColor: "rgba(20,184,166,0.12)" }}>
              <div className="flex justify-center pb-1"><LanguageSwitcher /></div>
              {user ? (
                <>
                  <Link to={dashboardPath} onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 w-full font-bold text-sm py-2.5 rounded-xl"
                    style={{ background: "rgba(20,184,166,0.1)", color: "#0d9488", border: "1px solid rgba(20,184,166,0.2)" }}>
                    <LayoutDashboard className="w-4 h-4" /> {t("common.dashboard")}
                  </Link>
                  <button onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full border-2 border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl">
                    <LogOut className="w-4 h-4" /> {t("common.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 w-full font-bold text-sm py-2.5 rounded-xl"
                    style={{ border: "1.5px solid #14b8a6", color: "#0d9488" }}>
                    <User className="w-4 h-4" /> {t("common.login")}
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)}
                    className="cta-3d flex items-center justify-center gap-2 w-full text-white font-black text-sm py-3 rounded-xl"
                    style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
                    {t("nav.checkSymptoms")}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
