import { useEffect } from "react";

const SELECTOR = ".card, .kpi, .hero-card";

/**
 * Cards rise in one after another when a page opens — including cards that
 * appear later, once their data has loaded. `resetKey` restarts it (e.g. the route).
 */
export default function useRiseIn(ref, resetKey) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    let index = 0;
    let timer;

    const tag = (elements) => {
      elements.forEach((el) => {
        if (el.dataset.risen) return;
        el.dataset.risen = "1";
        el.style.setProperty("--stagger", String(Math.min(index++, 12)));
        el.classList.add("rise-in");
      });
      // a new batch (e.g. after data loads) starts its own short cascade
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { index = 0; }, 150);
    };

    tag(root.querySelectorAll(SELECTOR));
    const observer = new MutationObserver((mutations) => {
      const found = [];
      mutations.forEach((m) => m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches(SELECTOR)) found.push(node);
        found.push(...node.querySelectorAll(SELECTOR));
      }));
      if (found.length) tag(found);
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, [ref, resetKey]);
}
