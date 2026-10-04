import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { LANGUAGES } from "../i18n";

/** EN / FR segmented control. `variant="glass"` for use on the blue hero. */
export default function LanguageSwitcher({ variant = "default", className = "" }) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
  const glass = variant === "glass";

  return (
    <div role="group" aria-label={t("common.language")}
      className={`inline-flex items-center gap-1 rounded-[14px] p-1 ${glass ? "bg-white/15 backdrop-blur" : "bg-panel border border-line"} ${className}`}>
      <Globe className={`w-3.5 h-3.5 ml-1.5 ${glass ? "text-white/70" : "text-dim"}`} aria-hidden="true" />
      {LANGUAGES.map(l => {
        const on = current === l.code;
        return (
          <button key={l.code} type="button" onClick={() => i18n.changeLanguage(l.code)}
            aria-pressed={on} title={l.name} lang={l.code}
            className={`text-[13px] font-bold px-2.5 py-1.5 rounded-[10px] transition-colors
              ${on
                ? (glass ? "bg-white text-ink" : "bg-accent text-white shadow-glow")
                : (glass ? "text-white/80 hover:text-white" : "text-muted hover:text-ink")}`}>
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
