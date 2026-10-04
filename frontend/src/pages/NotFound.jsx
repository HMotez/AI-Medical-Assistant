import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Home, Stethoscope, AlertCircle } from "lucide-react";

export default function NotFound() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const dashPath =
    user?.role === "admin"  ? "/admin"  :
    user?.role === "doctor" ? "/doctor" : user ? "/patient" : "/";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: "#eaf6fb" }}>
      <LanguageSwitcher className="absolute top-4 right-4" />
      <div className="text-center max-w-md">

        {/* Icon */}
        <div className="w-24 h-24 bg-teal-50 border-4 border-teal-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-12 h-12 text-teal-400" />
        </div>

        {/* 404 number */}
        <div className="text-8xl font-black text-teal-500 leading-none mb-2">404</div>

        {/* Message */}
        <h1 className="text-2xl font-black text-gray-900 mb-3">{t("notFound.title")}</h1>
        <p className="text-gray-500 text-base leading-relaxed mb-8">{t("notFound.text")}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary gap-2">
            <Home className="w-4 h-4" /> {t("notFound.home")}
          </Link>
          {user && (
            <Link to={dashPath} className="btn-outline gap-2">
              <Stethoscope className="w-4 h-4" /> {t("notFound.dashboard")}
            </Link>
          )}
        </div>

        {/* Branding */}
        <div className="mt-10 flex items-center justify-center gap-2 text-gray-400 text-sm">
          <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-3.5 h-3.5 text-white" />
          </div>
          {t("common.appName")}
        </div>
      </div>
    </div>
  );
}
