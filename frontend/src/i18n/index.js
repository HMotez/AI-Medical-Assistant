import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "fr", label: "FR", name: "Français" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    fallbackLng: "en",
    supportedLngs: LANGUAGES.map(l => l.code),
    nonExplicitSupportedLngs: true,          // "fr-FR" → "fr"
    interpolation: { escapeValue: false },   // React already escapes
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "lang",
      caches: ["localStorage"],
    },
  });

const syncHtmlLang = (lng) => { document.documentElement.lang = lng?.slice(0, 2) || "en"; };
syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

/** Current language as a 2-letter code ("en" | "fr"). */
export const currentLang = () => (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);

/** Locale for Intl / toLocaleString. */
export const dateLocale = () => (currentLang() === "fr" ? "fr-FR" : "en-US");

export default i18n;
