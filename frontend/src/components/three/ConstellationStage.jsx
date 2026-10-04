import { lazy, Suspense } from "react";

// three.js is only downloaded when the 3D view is shown
const SymptomConstellation = lazy(() => import("./SymptomConstellation"));

/**
 * Blue gradient hero card: text on the left, the 3D symptom constellation on the right.
 * `photo` (optional) is blended in as a blue duotone behind both.
 * `children` is the text content; the card sizes itself to it (min 260px).
 */
export default function ConstellationStage({ children, className = "", caption = true, photo }) {
  return (
    <section className={`hero-card min-h-[260px] grid md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] ${className}`}>
      {photo && (
        <>
          <img src={photo} alt="" className="hero-photo" aria-hidden="true" />
          {/* keeps the text side readable */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(90deg, rgba(28,63,201,0.55) 0%, rgba(28,63,201,0.2) 55%, transparent 100%)" }} />
        </>
      )}
      <div className="relative z-[2] p-7 md:p-8 flex flex-col justify-end min-w-0">
        {children}
      </div>
      <div className="relative z-[1] min-h-[260px]">
        <Suspense fallback={null}>
          <SymptomConstellation className="absolute inset-0" tone="light" showCaption={caption} />
        </Suspense>
      </div>
    </section>
  );
}
