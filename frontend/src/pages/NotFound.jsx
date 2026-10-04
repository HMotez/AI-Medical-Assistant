import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeSwitcher from "../components/ThemeSwitcher";
import Logo from "../components/ui/Logo";
import PhotoBackdrop from "../components/layout/PhotoBackdrop";
import { Home, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const dashPath =
    user?.role === "admin"  ? "/admin"  :
    user?.role === "doctor" ? "/doctor" : user ? "/patient" : "/";

  return (
    <div className="relative min-h-screen p-0 sm:p-4">
      <PhotoBackdrop />
      <div className="app-frame min-h-[calc(100vh-2rem)] p-5 flex flex-col max-sm:rounded-none">
        <div className="flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-2"><LanguageSwitcher /><ThemeSwitcher /></div>
        </div>
        <div className="flex-1 grid place-items-center">
          <div className="card text-center max-w-md w-full !p-10 page-enter">
            <div className="font-display text-[88px] font-extrabold leading-none bg-hero bg-clip-text text-transparent">404</div>
            <h1 className="text-[25.5px] font-bold mt-3">{t("notFound.title")}</h1>
            <p className="text-muted text-[15.5px] mt-2">{t("notFound.text")}</p>
            <div className="flex flex-wrap gap-2.5 justify-center mt-6">
              <Link to="/" className="btn-primary"><Home className="w-4 h-4" /> {t("notFound.home")}</Link>
              {user && <Link to={dashPath} className="btn-ghost"><LayoutDashboard className="w-4 h-4" /> {t("notFound.dashboard")}</Link>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
