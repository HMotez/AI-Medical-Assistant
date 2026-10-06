import { useState } from "react";
import { assetUrl } from "../../api/files";

/** Profile photo, or the first letter of the name on the brand gradient. */
export default function Avatar({ user, size = 40, className = "", ring = false }) {
  const [broken, setBroken] = useState(false);
  const src = !broken && assetUrl(user?.avatar_url);
  const letter = (user?.full_name || user?.email || "?").trim()[0]?.toUpperCase() || "?";
  return (
    <span className={`relative inline-grid place-items-center shrink-0 overflow-hidden text-white font-bold
      ${ring ? "ring-4 ring-panel shadow-elev2" : ""} ${className}`}
      style={{ width: size, height: size, borderRadius: size >= 80 ? 28 : Math.round(size * 0.32),
               background: "var(--hero)", fontSize: Math.round(size * 0.4) }}>
      {src
        ? <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setBroken(true)} />
        : <span aria-hidden="true">{letter}</span>}
    </span>
  );
}
