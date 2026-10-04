import { Link, useLocation } from "react-router-dom";
import PhotoBackdrop from "./PhotoBackdrop";
import { photoForPath } from "../../constants/photos";
import { useTranslation } from "react-i18next";
import ConstellationStage from "../three/ConstellationStage";
import LanguageSwitcher from "../LanguageSwitcher";
import ThemeSwitcher from "../ThemeSwitcher";
import Logo from "../ui/Logo";

/**
 * Login / register: the frame holds a blue constellation card (story) and a
 * white card with the form. `aside` is the text in the blue card.
 */
export default function AuthLayout({ aside, footer, children }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    <div className="relative min-h-screen p-0 sm:p-4 lg:p-7">
      <PhotoBackdrop />
      <div className="app-frame min-h-[calc(100vh-3.5rem)] p-3 sm:p-4 lg:p-5 grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-4 max-sm:rounded-none">
        <div className="hidden lg:flex flex-col gap-4 min-w-0">
          <Link to="/" className="w-fit px-1 pt-1"><Logo /></Link>
          <ConstellationStage className="flex-1 !grid-cols-1 !grid-rows-[auto_minmax(280px,1fr)]" caption photo={photoForPath(pathname)}>
            {aside}
          </ConstellationStage>
          {footer && <p className="text-[13.5px] text-dim text-center">{footer}</p>}
        </div>

        <div className="card !p-0 flex flex-col min-w-0">
          <div className="flex items-center justify-between p-5">
            <Link to="/" className="lg:hidden"><Logo /></Link>
            <div className="ml-auto flex items-center gap-2"><LanguageSwitcher /><ThemeSwitcher /></div>
          </div>
          <div className="flex-1 grid place-items-center px-5 sm:px-10 pb-10">
            <div className="w-full max-w-md page-enter">{children}</div>
          </div>
        </div>
      </div>
      <span className="sr-only">{t("common.appName")}</span>
    </div>
  );
}
