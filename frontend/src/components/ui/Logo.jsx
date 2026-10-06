import { useTranslation } from "react-i18next";
import { Stethoscope } from "lucide-react";

const DEPTH = [0, 1, 2, 3, 4, 5];   // extrusion layers (px) behind the face

/**
 * Brand mark + name. The mark is a small 3D tile: an extruded blue body that
 * rocks slowly, the stethoscope floating above its face, and an orbit ring with
 * a dot passing in front of and behind it. Hover spins it once.
 * `size="lg"` for larger placements.
 */
export default function Logo({ size = "md", showText = true }) {
  const { t } = useTranslation();
  const lg = size === "lg";
  return (
    <div className="logo3d-wrap flex items-center gap-5">
      <div className={`logo3d ${lg ? "w-[60px] h-[60px]" : "w-[52px] h-[52px]"}`} aria-hidden="true">
        <div className="logo3d-body">
          {DEPTH.map(z => <span key={z} className="logo3d-layer" style={{ transform: `translateZ(${z}px)` }} />)}
          <div className="logo3d-face">
            <Stethoscope className={`logo3d-icon ${lg ? "w-7 h-7" : "w-6 h-6"}`} strokeWidth={2.2} />
          </div>
          <div className="logo3d-orbit"><div className="logo3d-ring"><span className="logo3d-dot" /></div></div>
        </div>
      </div>
      {showText && (
        <div className="leading-tight min-w-0">
          <div className={`font-display font-bold ${lg ? "text-[24px]" : "text-[21px]"} text-ink whitespace-nowrap tracking-[-0.02em]`}>
            AI <span className="bg-hero bg-clip-text text-transparent">Medical</span>
          </div>
          <div className="text-[12.5px] uppercase tracking-[0.22em] text-dim mt-0.5">{t("common.brandSub")}</div>
        </div>
      )}
    </div>
  );
}
