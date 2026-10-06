import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Search } from "lucide-react";
import { searchable as normalize } from "../../i18n/medical";

/**
 * Dropdown list in the app's style (replaces the browser's <select>).
 *
 * options: [{ value, label, icon?, hint? }]. `placeholder` is shown when value is "".
 * Long lists (more than 8 options) get a search box. Keyboard: ↑ ↓ Home End to move,
 * Enter to pick, Esc to close, letters to jump. The panel opens upward when there
 * is no room below, and is drawn above everything (portal) so cards never clip it.
 */
export default function Select({
  id, value, onChange, options, placeholder, icon: Icon, required = false, disabled = false,
  searchable, className = "", "aria-label": ariaLabel,
}) {
  const { t } = useTranslation();
  const autoId = useId();
  const listId = `${id || autoId}-list`;
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState(null);       // { left, width, top | bottom, up }
  const typed = useRef({ text: "", at: 0 });

  const withSearch = searchable ?? options.length > 8;
  const selected = options.find(o => o.value === value);
  const shown = useMemo(() => {
    const q = normalize(query);
    return q ? options.filter(o => normalize(o.label).includes(q)) : options;
  }, [options, query]);

  // Where the panel goes: under the field, or above it when the screen is too short
  const measure = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom, above = r.top;
    const up = below < 260 && above > below;
    setPlace({
      left: r.left, width: Math.max(r.width, 220),
      ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
      maxHeight: Math.max(160, Math.min(320, (up ? above : below) - 16)), up,
    });
  };
  useLayoutEffect(() => { if (open) measure(); }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!panelRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) setOpen(false);
    };
    const onMove = () => measure();
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  // Only one list open at a time
  useEffect(() => {
    const onOther = (e) => { if (e.detail !== listId) setOpen(false); };
    window.addEventListener("select-open", onOther);
    return () => window.removeEventListener("select-open", onOther);
  }, [listId]);

  // Opening: start on the chosen option, focus the search box if there is one
  useEffect(() => {
    if (!open) { setQuery(""); return; }
    window.dispatchEvent(new CustomEvent("select-open", { detail: listId }));
    setActive(Math.max(0, options.findIndex(o => o.value === value)));
    if (withSearch) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setActive(a => Math.min(a, Math.max(shown.length - 1, 0))); }, [shown.length]);

  // Keep the highlighted option in view
  useEffect(() => {
    if (open) panelRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (option) => {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKey = (e) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); setOpen(true); }
      return;
    }
    const last = shown.length - 1;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => (a >= last ? 0 : a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => (a <= 0 ? last : a - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(last); }
    else if (e.key === "Enter") { e.preventDefault(); if (shown[active]) choose(shown[active]); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
    else if (e.key === "Tab") setOpen(false);
    else if (!withSearch && e.key.length === 1) {
      // type-ahead: jump to the first option starting with the typed letters
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const hit = shown.findIndex(o => normalize(o.label).startsWith(normalize(typed.current.text)));
      if (hit >= 0) setActive(hit);
    }
  };

  const optionId = (i) => `${listId}-${i}`;

  return (
    <div className={`relative ${className}`}>
      <button ref={triggerRef} id={id} type="button" disabled={disabled}
        role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-label={ariaLabel}
        aria-activedescendant={open && !withSearch && shown[active] ? optionId(active) : undefined}
        onClick={() => setOpen(o => !o)} onKeyDown={onKey}
        className={`input-field select-trigger flex items-center gap-2.5 text-left ${Icon ? "!pl-10" : ""} ${open ? "is-open" : ""}`}>
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dim pointer-events-none" />}
        {selected?.icon && <selected.icon className="w-4 h-4 text-accent shrink-0" />}
        <span className={`flex-1 min-w-0 truncate ${selected ? "text-ink" : "text-dim"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-dim shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-accent" : ""}`} />
      </button>

      {/* Lets the browser's form validation flag an empty required list */}
      {required && (
        <input tabIndex={-1} aria-hidden="true" required value={value || ""} onChange={() => {}}
          onFocus={() => triggerRef.current?.focus()}
          className="absolute left-4 bottom-0 w-px h-px opacity-0 pointer-events-none" />
      )}

      {open && place && createPortal(
        <div ref={panelRef} className={`select-panel ${place.up ? "is-up" : ""}`}
          style={{ left: place.left, width: place.width, top: place.top, bottom: place.bottom }}
          onKeyDown={onKey}>
          {withSearch && (
            <div className="relative p-1.5 pb-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dim pointer-events-none" />
              <input ref={searchRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                placeholder={t("common.search")} aria-label={t("common.search")}
                aria-controls={listId} aria-activedescendant={shown[active] ? optionId(active) : undefined}
                className="w-full rounded-[12px] bg-panel2 pl-9 pr-3 py-2 text-[14.5px] text-ink outline-none placeholder:text-dim focus:ring-2 focus:ring-accent/30" />
            </div>
          )}
          <ul id={listId} role="listbox" aria-labelledby={id} className="overflow-y-auto p-1.5 grid gap-0.5"
            style={{ maxHeight: place.maxHeight - (withSearch ? 52 : 0) }}>
            {shown.map((o, i) => {
              const isSelected = o.value === value, isActive = i === active;
              return (
                <li key={o.value === "" ? "__empty" : o.value} id={optionId(i)} data-index={i}
                  role="option" aria-selected={isSelected}
                  onPointerEnter={() => setActive(i)} onClick={() => choose(o)}
                  className={`select-option ${isActive ? "is-active" : ""} ${isSelected ? "is-selected" : ""}`}>
                  {o.icon && <o.icon className="w-4 h-4 shrink-0 opacity-80" />}
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{o.label}</span>
                    {o.hint && <span className="block text-[12.5px] text-dim font-normal truncate">{o.hint}</span>}
                  </span>
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </li>
              );
            })}
            {shown.length === 0 && <li className="px-3 py-3 text-[14px] text-dim text-center">—</li>}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}
