import { useLocation } from "react-router-dom";
import { photoForPath } from "../../constants/photos";
import { PhotoLayer } from "./PhotoPanel";

/**
 * Page title block: eyebrow, title, one-line description, optional actions.
 * By default it is a photo banner (the page's photo in duotone + graphics);
 * `plain` gives the bare heading used between sections, `compact` a lower banner.
 */
export default function PageHead({ eyebrow, title, subtitle, actions, back, photo, plain = false, compact = false }) {
  const { pathname } = useLocation();

  if (plain) {
    return (
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="flex items-end gap-3 min-w-0">
          {back}
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h2 className="text-[30px] sm:text-[32px] font-bold leading-tight mt-1.5">{title}</h2>
            {subtitle && <p className="text-muted text-[15px] mt-1.5 max-w-xl">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
    );
  }

  return (
    <header className={`photo-panel photo-banner ${compact ? "min-h-[150px]" : "min-h-[196px]"} mb-1`}>
      <PhotoLayer photo={photo || photoForPath(pathname)} position="center 30%" />
      <div className="relative z-[2] h-full flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-end gap-3 min-w-0">
          {back}
          <div className="min-w-0">
            {eyebrow && <span className="pill pill-glass !py-1 !text-[12.5px] font-data uppercase tracking-[0.14em]">{eyebrow}</span>}
            <h1 className={`${compact ? "text-[28px]" : "text-[30px] sm:text-[36px]"} font-bold leading-tight mt-2.5`}>{title}</h1>
            {subtitle && <p className="text-white/80 text-[15px] mt-1 max-w-xl">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
