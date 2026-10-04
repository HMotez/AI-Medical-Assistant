import { useState } from "react";
import { createPortal } from "react-dom";

/** Hover tooltip shared by the charts. Spread `bind(content)` on a hit target. */
export default function useChartTip() {
  const [tip, setTip] = useState(null);

  const bind = (content) => ({
    onPointerEnter: (e) => setTip({ content, x: e.clientX, y: e.clientY }),
    onPointerMove:  (e) => setTip({ content, x: e.clientX, y: e.clientY }),
    onPointerLeave: () => setTip(null),
  });

  const node = tip && createPortal(
    <div className="chart-tip" role="tooltip"
      style={{ left: Math.min(tip.x + 14, window.innerWidth - 220), top: tip.y + 14 }}>
      {tip.content}
    </div>,
    document.body,
  );

  return { bind, node };
}
