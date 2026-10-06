import { useEffect, useRef, useState } from "react";

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Animates the number inside a value ("41", "95%", "1:3", "+4.2%") from 0 up to
 * its value when it first appears or changes. Non-numeric values show as-is.
 */
export default function CountUp({ value, duration = 900 }) {
  const text = value === null || value === undefined ? "—" : String(value);
  const match = text.match(/^([^\d-]*)(-?\d+(?:[.,]\d+)?)(.*)$/);
  const [shown, setShown] = useState(match ? 0 : null);
  const frame = useRef();

  const target = match ? parseFloat(match[2].replace(",", ".")) : null;
  const decimals = match && /[.,]/.test(match[2]) ? match[2].split(/[.,]/)[1].length : 0;

  useEffect(() => {
    if (target === null) return undefined;
    if (reducedMotion()) { setShown(target); return undefined; }
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(target * eased);
      if (p < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    // Lands on the exact value even if animation frames are throttled
    const settle = window.setTimeout(() => setShown(target), duration + 80);
    return () => { cancelAnimationFrame(frame.current); window.clearTimeout(settle); };
  }, [target, duration]);

  if (!match) return text;
  // shown is still null for one render when a value arrives after "—" (loading)
  const number = (shown ?? 0).toFixed(decimals);
  return `${match[1]}${match[2].includes(",") ? number.replace(".", ",") : number}${match[3]}`;
}
