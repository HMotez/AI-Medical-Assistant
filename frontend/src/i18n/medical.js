/**
 * Display names for medical data that comes from the backend / ML model.
 * The backend sends stable identifiers (symptom codes, English disease names,
 * French specialist names); medical-labels.json turns them into labels per
 * language. The backend PDF report reads the same file.
 * Anything missing falls back to a readable version of the identifier.
 */
import { useTranslation } from "react-i18next";
import LABELS from "./medical-labels.json";

const pick = (table, key, lang) => {
  const entry = table[key];
  return entry ? entry[lang === "fr" ? 1 : 0] : null;
};

const humanize = (code) => {
  const s = String(code ?? "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const symptomLabel    = (code, lang) => pick(LABELS.symptoms, code, lang) || humanize(code);
export const diseaseLabel    = (name, lang) => pick(LABELS.diseases, name, lang) || name || "";
export const specialistLabel = (name, lang) => pick(LABELS.specialists, name, lang) || name || "";

/** Strips accents/case so "fievre" matches "Fièvre" in searches. */
export const searchable = (s) =>
  String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Hook returning label helpers bound to the current language. */
export function useMedicalLabels() {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
  return {
    lang,
    symptom:    (code) => symptomLabel(code, lang),
    disease:    (name) => diseaseLabel(name, lang),
    specialist: (name) => specialistLabel(name, lang),
  };
}
