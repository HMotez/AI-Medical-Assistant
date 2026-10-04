import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Moon, Sun } from "lucide-react";
import { getTheme, setTheme, onThemeChange } from "../theme";

/** Round sun / moon button that flips between the light and dark themes. */
export default function ThemeSwitcher({ className = "" }) {
  const { t } = useTranslation();
  const [theme, setLocal] = useState(getTheme);
  useEffect(() => onThemeChange(setLocal), []);

  const dark = theme === "dark";
  const label = t(dark ? "common.themeLight" : "common.themeDark");

  return (
    <button type="button" onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label} title={label}
      className={`relative w-[42px] h-[42px] shrink-0 grid place-items-center rounded-full bg-panel border border-line text-ink
        overflow-hidden transition-transform hover:-translate-y-0.5 active:scale-95 ${className}`}>
      {/* the two icons swap with a little turn */}
      <Sun className="absolute w-[18px] h-[18px] transition-all duration-500"
        style={{ transform: dark ? "rotate(90deg) scale(0)" : "rotate(0) scale(1)", opacity: dark ? 0 : 1, color: "rgb(var(--warn))" }} />
      <Moon className="absolute w-[18px] h-[18px] transition-all duration-500"
        style={{ transform: dark ? "rotate(0) scale(1)" : "rotate(-90deg) scale(0)", opacity: dark ? 1 : 0, color: "rgb(var(--accent-2))" }} />
    </button>
  );
}
