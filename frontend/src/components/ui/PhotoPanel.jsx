/**
 * Photo panels: a medical photo in a blue duotone with graphic layers on top
 * (dot grid, scan rings, a heartbeat line). The photo is decoration; text sits
 * on the dark side of the overlay so it stays readable in both themes.
 */

/** Heartbeat line + scan rings + dot grid. `rings` places the rings on the right. */
export function PanelGraphic({ rings = true, pulse = true }) {
  return (
    <div className="panel-graphic" aria-hidden="true">
      <div className="panel-dots" />
      {rings && (
        <svg className="panel-rings" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="96" />
          <circle cx="100" cy="100" r="70" />
          <circle cx="100" cy="100" r="44" className="ring-spin" strokeDasharray="4 7" />
          <path d="M100 0v22M100 178v22M0 100h22M178 100h22" />
          <circle cx="100" cy="100" r="3" className="ring-dot" />
        </svg>
      )}
      {pulse && (
        <svg className="panel-pulse" viewBox="0 0 600 60" preserveAspectRatio="none">
          <path className="pulse-base" vectorEffect="non-scaling-stroke"
            d="M0 34H170l8 0 6-12 8 26 9-44 9 38 6-8H330l7 0 5-7 6 14 5-7H600" />
          <path className="pulse-run" vectorEffect="non-scaling-stroke" pathLength="100"
            d="M0 34H170l8 0 6-12 8 26 9-44 9 38 6-8H330l7 0 5-7 6 14 5-7H600" />
        </svg>
      )}
      <span className="panel-corner tl" /><span className="panel-corner br" />
    </div>
  );
}

/** Photo + duotone + graphics, as the background of a positioned parent. */
export function PhotoLayer({ photo, rings, pulse, position = "center" }) {
  return (
    <>
      <img src={photo} alt="" aria-hidden="true" className="panel-photo" style={{ objectPosition: position }} loading="lazy" />
      <div className="panel-shade" aria-hidden="true" />
      <PanelGraphic rings={rings} pulse={pulse} />
    </>
  );
}

/** A card whose background is a photo; children are laid out on top in white. */
export function PhotoCard({ photo, className = "", children, rings = false, pulse = true, position, as: Tag = "div" }) {
  return (
    <Tag className={`photo-panel ${className}`}>
      <PhotoLayer photo={photo} rings={rings} pulse={pulse} position={position} />
      <div className="relative z-[2] h-full flex flex-col">{children}</div>
    </Tag>
  );
}
