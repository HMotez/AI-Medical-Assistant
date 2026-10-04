import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { LANGUAGES } from "../i18n";

/**
 * EN / FR toggle. `variant="light"` for white backgrounds (navbar, auth pages),
 * `variant="dark"` for the dark sidebar.
 */
export default function LanguageSwitcher({ variant = "light", className = "" }) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);

  const styles = variant === "dark"
    ? { wrap: "bg-white/5 border-white/10", icon: "text-white/40",
        active: "bg-teal-500/30 text-teal-200", idle: "text-white/50 hover:text-white" }
    : { wrap: "bg-white border-gray-200", icon: "text-gray-400",
        active: "bg-teal-500 text-white", idle: "text-gray-500 hover:text-teal-700" };

  return (
    <div role="group" aria-label={t("common.language")}
      className={`inline-flex items-center gap-1 rounded-full border p-1 ${styles.wrap} ${className}`}>
      <Globe className={`w-3.5 h-3.5 ml-1.5 ${styles.icon}`} aria-hidden="true" />
      {LANGUAGES.map(l => (
        <button key={l.code} type="button" onClick={() => i18n.changeLanguage(l.code)}
          aria-pressed={current === l.code} title={l.name} lang={l.code}
          className={`text-[11px] font-black px-2.5 py-1 rounded-full transition-colors
            ${current === l.code ? styles.active : styles.idle}`}>
          {l.label}
        </button>
      ))}
    </div>
  );
}
