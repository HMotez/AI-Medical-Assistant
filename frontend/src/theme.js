/**
 * Light ("frost") / dark ("night") theme. The choice is remembered; the first
 * visit starts in dark. Applied as data-theme on <html> — index.css re-values
 * every color token under [data-theme="dark"].
 */
const KEY = "theme";
const listeners = new Set();

export function getTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* storage unavailable: use the default */ }
  return "dark";
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
}

export function setTheme(theme) {
  const root = document.documentElement;
  // Recolor everything smoothly for the duration of the switch
  root.classList.add("theme-switching");
  apply(theme);
  window.setTimeout(() => root.classList.remove("theme-switching"), 500);
  try { localStorage.setItem(KEY, theme); } catch { /* not persisted */ }
  listeners.forEach(fn => fn(theme));
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Apply before the first render so the page never flashes the wrong theme
apply(getTheme());
