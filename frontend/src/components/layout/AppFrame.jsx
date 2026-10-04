import { useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import PhotoBackdrop from "./PhotoBackdrop";
import ThemeSwitcher from "../ThemeSwitcher";
import useRiseIn from "../ui/useRiseIn";
import { Menu, Plus } from "lucide-react";

/** Signed-in layout: the whole app sits in one rounded frame (sidebar + main). */
export default function AppFrame() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const pageRef = useRef(null);
  useRiseIn(pageRef, pathname);

  return (
    <div className="relative h-screen p-0 sm:p-4 lg:p-7 flex">
      <PhotoBackdrop />
      <div className="app-frame flex-1 min-w-0 grid lg:grid-cols-[250px_minmax(0,1fr)] gap-0 lg:gap-4 p-3 lg:p-4 overflow-hidden max-sm:rounded-none">
        <Sidebar open={open} onClose={() => setOpen(false)} />

        <main className="min-w-0 min-h-0 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-1 pb-3">
            <button onClick={() => setOpen(true)} aria-label={t("sidebar.openMenu")}
              className="lg:hidden w-[42px] h-[42px] grid place-items-center rounded-full bg-panel border border-line text-ink">
              <Menu className="w-[18px] h-[18px]" />
            </button>
            <div className="ml-auto flex items-center gap-2.5">
              <ThemeSwitcher className="lg:hidden" />
              {user?.role === "patient" && pathname !== "/patient/analyze" && (
                <Link to="/patient/analyze" className="btn-primary btn-sm">
                  <Plus className="w-4 h-4" /> {t("common.newAnalysis")}
                </Link>
              )}
              <div className="hidden sm:flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full bg-panel border border-line">
                <div className="w-8 h-8 rounded-full grid place-items-center text-white text-[13.5px] font-bold" style={{ background: "var(--hero)" }}>
                  {(user?.full_name || "?")[0].toUpperCase()}
                </div>
                <span className="text-[14.5px] font-semibold text-ink">{user?.full_name?.split(" ")[0]}</span>
              </div>
            </div>
          </div>

          <div key={pathname} ref={pageRef} className="flex-1 min-h-0 overflow-y-auto px-1 pb-6 page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
