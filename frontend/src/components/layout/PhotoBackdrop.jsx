import { useLocation } from "react-router-dom";
import { photoForPath } from "../../constants/photos";

/**
 * The page's photo behind the app frame: softened with blur and a frost veil
 * so the frame floats over it like glass and text stays readable.
 */
export default function PhotoBackdrop({ photo }) {
  const { pathname } = useLocation();
  const src = photo || photoForPath(pathname);
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-page" aria-hidden="true">
      <img key={src} src={src} alt="" className="photo-backdrop w-full h-full object-cover" />
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, rgb(var(--page) / var(--veil)) 0%, rgb(var(--page) / calc(var(--veil) - 0.25)) 50%, rgb(var(--page) / var(--veil)) 100%)" }} />
    </div>
  );
}
