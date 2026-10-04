import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import { useMedicalLabels, symptomLabel, searchable } from "../../i18n/medical";
import { Search, X, Activity, AlertCircle, Loader2, CheckCircle, ClipboardList, Sparkles, MessageSquareText } from "lucide-react";

// Stored as codes so the analysis can be shown in any language
const DURATIONS = ["lt_1d", "1_3d", "4_7d", "1_4w", "gt_1m"];

export default function SymptomChecker() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const navigate = useNavigate();
  const [selected, setSelected]   = useState([]);
  const [query, setQuery]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [severity, setSeverity]   = useState(null);
  const [duration, setDuration]   = useState("");
  const [freeText, setFreeText]   = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extraction, setExtraction] = useState(null);   // { added, negated, none }

  useEffect(() => {
    axiosClient.get("/api/symptoms")
      .then(({ data }) => {
        if (!data.symptoms?.length) setError(t("symptomChecker.errors.unavailable"));
        setAllSymptoms(data.symptoms || []);
      })
      .catch(() => setError(t("symptomChecker.errors.listFailed")))
      .finally(() => setListLoading(false));
  }, [t]);

  // Search matches the code and both the English and French names, ignoring accents
  const filtered = useMemo(() => {
    const q = searchable(query.trim());
    const sorted = [...allSymptoms].sort((a, b) =>
      symptomLabel(a, labels.lang).localeCompare(symptomLabel(b, labels.lang), labels.lang));
    if (!q) return sorted;
    return sorted.filter(s =>
      [s.replace(/_/g, " "), symptomLabel(s, "en"), symptomLabel(s, "fr")].some(n => searchable(n).includes(q)));
  }, [query, allSymptoms, labels.lang]);

  const toggle = (s) =>
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const listNames = (codes) => codes.map(labels.symptom).join(", ");

  const detectFromText = async () => {
    if (!freeText.trim()) return;
    setExtracting(true); setError("");
    try {
      const { data } = await axiosClient.post("/api/symptoms/extract", { text: freeText });
      const added = data.symptoms.filter(s => !selected.includes(s));
      setSelected(prev => [...prev, ...added]);
      setExtraction({ added, negated: data.negated, none: data.symptoms.length === 0 });
    } catch {
      setError(t("symptomChecker.errors.extractFailed"));
    } finally { setExtracting(false); }
  };

  const submit = async () => {
    if (selected.length < 1) { setError(t("symptomChecker.errors.minOne")); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await axiosClient.post("/api/analysis", {
        symptom_names:    selected,
        severity:         severity ?? undefined,
        symptom_duration: duration || undefined,
        free_text:        freeText.trim() || undefined,
      });
      navigate(`/patient/results/${data.id}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : t("symptomChecker.errors.failed"));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/25">
          <ClipboardList className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-blue-300 text-xs font-black uppercase tracking-widest mb-1">{t("symptomChecker.step")}</p>
          <h1 className="text-2xl font-black text-white">{t("symptomChecker.title")}</h1>
          <p className="text-white/50 text-sm mt-0.5">{t("symptomChecker.subtitle")}</p>
        </div>
      </div>

      <div className="max-w-4xl space-y-5">

        {/* Free-text description */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <label htmlFor="free-text" className="flex items-center gap-2 font-black text-white mb-1">
            <MessageSquareText className="w-5 h-5 text-teal-300" /> {t("symptomChecker.describeTitle")}
          </label>
          <p className="text-xs text-white/45 mb-4">{t("symptomChecker.describeHint")}</p>
          <textarea id="free-text" rows={3} maxLength={2000} value={freeText}
            onChange={e => { setFreeText(e.target.value); setExtraction(null); }}
            placeholder={t("symptomChecker.describePlaceholder")}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all resize-y" />
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <button onClick={detectFromText} disabled={extracting || !freeText.trim()}
              className="flex items-center gap-2 bg-teal-500 text-white text-sm font-black px-5 py-2.5 rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50">
              {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {t("symptomChecker.detect")}
            </button>
            {extraction && (
              <p className="text-xs text-white/70 font-semibold" aria-live="polite">
                {extraction.none
                  ? t("symptomChecker.noneRecognised")
                  : extraction.added.length
                    ? t("symptomChecker.added", { count: extraction.added.length, list: listNames(extraction.added) })
                    : t("symptomChecker.alreadySelected")}
                {extraction.negated.length > 0 && (
                  <span className="block text-white/45 mt-1">
                    {t("symptomChecker.notAdded", { list: listNames(extraction.negated) })}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Selected tags */}
        {selected.length > 0 && (
          <div className="bg-teal-500/15 backdrop-blur-md border border-teal-400/30 rounded-2xl p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-teal-400" />
              <span className="font-black text-white">{t("symptomChecker.selected", { count: selected.length })}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.map(s => (
                <button key={s} onClick={() => toggle(s)}
                  aria-label={t("symptomChecker.removeSymptom", { name: labels.symptom(s) })}
                  className="flex items-center gap-1.5 bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-teal-600 transition-colors">
                  {labels.symptom(s)} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search + grid */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder={t("symptomChecker.searchPlaceholder")}
              aria-label={t("symptomChecker.searchPlaceholder")}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all"
            />
          </div>

          <div className="text-xs font-black text-white/40 uppercase tracking-wider mb-3">
            {t("symptomChecker.count", { count: filtered.length })} {query && t("symptomChecker.matching", { query })}
          </div>

          <div className="max-h-96 overflow-y-auto pr-1">
            {listLoading && (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-teal-400 animate-spin" /></div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {filtered.map(s => {
                const isSel = selected.includes(s);
                return (
                  <button key={s} onClick={() => toggle(s)} aria-pressed={isSel}
                    className={`text-left text-xs px-3.5 py-3 rounded-xl border transition-all font-semibold
                      ${isSel
                        ? "bg-teal-500 text-white border-teal-500 shadow-md scale-[0.98]"
                        : "border-white/15 bg-white/5 text-white/70 hover:border-teal-400/50 hover:bg-teal-500/15 hover:text-white"}`}>
                    {labels.symptom(s)}
                  </button>
                );
              })}
            </div>
            {!listLoading && filtered.length === 0 && (
              <p className="text-center text-white/40 font-bold py-8">{t("symptomChecker.noMatch")}</p>
            )}
          </div>
        </div>

        {/* Severity + duration — help the analysis judge urgency */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label htmlFor="severity" className="text-sm font-black text-white">{t("symptomChecker.severity")}</label>
              <span className="text-sm font-black text-teal-300">{severity ? `${severity} / 10` : t("common.notSet")}</span>
            </div>
            <input id="severity" type="range" min="1" max="10" value={severity ?? 5}
              onChange={e => setSeverity(Number(e.target.value))}
              className="w-full accent-teal-500" />
            <div className="flex justify-between text-[11px] text-white/40 font-semibold mt-1">
              <span>{t("symptomChecker.mild")}</span><span>{t("symptomChecker.unbearable")}</span>
            </div>
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-black text-white mb-3">{t("symptomChecker.duration")}</label>
            <select id="duration" value={duration} onChange={e => setDuration(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-teal-400/60">
              <option value="" className="text-gray-900">{t("symptomChecker.selectPlaceholder")}</option>
              {DURATIONS.map(d => <option key={d} value={d} className="text-gray-900">{t(`common.durations.${d}`)}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-3 bg-red-500/20 border border-red-400/30 text-red-300 text-sm font-medium px-4 py-3 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        <button onClick={submit} disabled={loading || selected.length === 0}
          className="btn-primary w-full py-4 text-base font-black disabled:opacity-50 gap-2 shadow-teal">
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> {t("symptomChecker.analyzing")}</>
            : <><Activity className="w-5 h-5" />
                {selected.length > 0 ? t("symptomChecker.analyze", { count: selected.length }) : t("symptomChecker.selectFirst")}
              </>}
        </button>
      </div>
    </div>
  );
}
