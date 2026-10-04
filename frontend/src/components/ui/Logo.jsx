import { useTranslation } from "react-i18next";
import { Stethoscope } from "lucide-react";

/** Brand mark + name. `size="lg"` for auth pages. */
export default function Logo({ size = "md", showText = true }) {
  const { t } = useTranslation();
  const box = size === "lg" ? "w-12 h-12 rounded-2xl" : "w-10 h-10 rounded-xl";
  return (
    <div className="flex items-center gap-3">
      <div className={`${box} grid place-items-center text-white shrink-0`}
        style={{
          background: "var(--hero)",
          boxShadow: "0 8px 18px -6px var(--glow), inset 0 -3px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.45)",
          animation: "logo-float 4.5s ease-in-out infinite",
        }}>
        <Stethoscope className={size === "lg" ? "w-6 h-6" : "w-5 h-5"} />
      </div>
      {showText && (
        <div className="leading-tight min-w-0">
          <div className="font-display font-bold text-[17.5px] text-ink whitespace-nowrap">
            AI <span className="bg-hero bg-clip-text text-transparent">Medical</span>
          </div>
          <div className="text-[11.5px] uppercase tracking-[0.18em] text-dim">{t("common.brandSub")}</div>
        </div>
      )}
    </div>
  );
}
