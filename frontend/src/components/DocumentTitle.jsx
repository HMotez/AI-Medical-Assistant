import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Path pattern → translation key; first match wins
const TITLES = [
  [/^\/$/,                      "pageTitles.home"],
  [/^\/login$/,                 "pageTitles.login"],
  [/^\/register$/,              "pageTitles.register"],
  [/^\/patient$/,               "sidebar.patient.dashboard"],
  [/^\/patient\/analyze$/,      "sidebar.patient.symptomChecker"],
  [/^\/patient\/results\//,     "pageTitles.results"],
  [/^\/patient\/history$/,      "sidebar.patient.history"],
  [/^\/patient\/trends$/,       "sidebar.patient.trends"],
  [/^\/patient\/chat$/,         "sidebar.patient.chat"],
  [/^\/(patient|doctor|admin)\/profile$/, "pageTitles.profile"],
  [/^\/doctor$/,                "sidebar.doctor.dashboard"],
  [/^\/admin\/verifications$/,  "pageTitles.verifications"],
  [/^\/doctor\/analysis\//,     "pageTitles.analysis"],
  [/^\/admin$/,                 "pageTitles.adminDashboard"],
  [/^\/admin\/stats$/,          "pageTitles.stats"],
  [/^\/admin\/diseases$/,       "pageTitles.diseases"],
];

/** Keeps the browser tab title in step with the page and the language. */
export default function DocumentTitle() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  useEffect(() => {
    const key = TITLES.find(([re]) => re.test(pathname))?.[1] || "pageTitles.notFound";
    document.title = `${t(key)} · ${t("common.appName")}`;
  }, [pathname, t, i18n.language]);
  return null;
}
