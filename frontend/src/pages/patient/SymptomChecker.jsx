import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import PageHead from "../../components/ui/PageHead";
import { useMedicalLabels, symptomLabel, searchable } from "../../i18n/medical";
import {
  Search, X, Activity, AlertCircle, Loader2, CheckCircle, Sparkles, MessageSquareText, SlidersHorizontal, ListChecks
} from "lucide-react";

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
  const [extraction, setExtraction] = useState(null);   // { added, negated, none, ai }

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
      setExtraction({ added, negated: data.negated, none: data.symptoms.length === 0, ai: data.source === "ai" });
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
    <div className="grid gap-4">
      <PageHead eyebrow={t("symptomChecker.step")} title={t("symptomChecker.title")} subtitle={t("symptomChecker.subtitle")} />

      <div className="grid xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="grid gap-4 min-w-0">
          {/* Free-text description */}
          <section className="card">
            <div className="card-head">
              <div className="card-icon"><MessageSquareText className="w-5 h-5" /></div>
              <div><h2>{t("symptomChecker.describeTitle")}</h2><small>{t("symptomChecker.describeHint")}</small></div>
            </div>
            <label htmlFor="free-text" className="sr-only">{t("symptomChecker.describeTitle")}</label>
            <textarea id="free-text" rows={3} maxLength={2000} value={freeText}
              onChange={e => { setFreeText(e.target.value); setExtraction(null); }}
              placeholder={t("symptomChecker.describePlaceholder")}
              className="input-field resize-y min-h-[96px]" />
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button onClick={detectFromText} disabled={extracting || !freeText.trim()} className="btn-primary">
                {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {t("symptomChecker.detect")}
              </button>
              {extraction && (
                <p className="text-[14px] text-muted flex-1 min-w-[200px]" aria-live="polite">
                  {extraction.ai && <span className="chip chip-accent mr-2"><Sparkles className="w-3 h-3" /> {t("symptomChecker.readByAI")}</span>}
                  {extraction.none
                    ? t("symptomChecker.noneRecognised")
                    : extraction.added.length
                      ? t("symptomChecker.added", { count: extraction.added.length, list: listNames(extraction.added) })
                      : t("symptomChecker.alreadySelected")}
                  {extraction.negated.length > 0 && (
                    <span className="block text-dim mt-1">{t("symptomChecker.notAdded", { list: listNames(extraction.negated) })}</span>
                  )}
                </p>
              )}
            </div>
          </section>

          {/* Full symptom list */}
          <section className="card">
            <div className="card-head">
              <div className="card-icon"><ListChecks className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <h2>{t("symptomChecker.count", { count: filtered.length })}</h2>
                {query && <small>{t("symptomChecker.matching", { query })}</small>}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-[14px] bg-panel2 px-3.5 py-2.5 mb-4">
              <Search className="w-4 h-4 text-dim shrink-0" />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder={t("symptomChecker.searchPlaceholder")} aria-label={t("symptomChecker.searchPlaceholder")}
                className="w-full bg-transparent outline-none text-[15px] text-ink placeholder:text-dim" />
            </div>
            <div className="max-h-[420px] overflow-y-auto pr-1">
              {listLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>}
              <div className="flex flex-wrap gap-2">
                {filtered.map(s => {
                  const isSel = selected.includes(s);
                  return (
                    <button key={s} onClick={() => toggle(s)} aria-pressed={isSel}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[14.5px] font-medium transition-all
                        ${isSel
                          ? "bg-accent text-white shadow-glow"
                          : "bg-panel border border-line text-ink hover:border-accent/40 hover:text-accent"}`}>
                      {isSel && <CheckCircle className="w-3.5 h-3.5" />}{labels.symptom(s)}
                    </button>
                  );
                })}
              </div>
              {!listLoading && filtered.length === 0 && <p className="text-center text-muted py-8">{t("symptomChecker.noMatch")}</p>}
            </div>
          </section>
        </div>

        {/* Summary panel: what will be analysed */}
        <aside className="grid gap-4 xl:sticky xl:top-0">
          <section className="card">
            <div className="card-head">
              <div className="card-icon"><CheckCircle className="w-5 h-5" /></div>
              <h2>{t("symptomChecker.selected", { count: selected.length })}</h2>
            </div>
            {selected.length === 0 ? (
              <p className="text-muted text-[14.5px]">{t("symptomChecker.selectFirst")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selected.map(s => (
                  <button key={s} onClick={() => toggle(s)} aria-label={t("symptomChecker.removeSymptom", { name: labels.symptom(s) })}
                    className="chip chip-accent !text-[14px] !py-1.5 hover:!bg-bad/10 hover:!text-bad transition-colors">
                    {labels.symptom(s)} <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="card grid gap-5">
            <div className="card-head !mb-0">
              <div className="card-icon"><SlidersHorizontal className="w-5 h-5" /></div>
              <h2>{t("symptomChecker.severity")}</h2>
            </div>
            <div>
              <div className="flex justify-between items-baseline">
                <label htmlFor="severity" className="field-label !mb-0">{t("symptomChecker.severity")}</label>
                <span className="font-data text-[15.5px] text-accent">{severity ? `${severity}/10` : t("common.notSet")}</span>
              </div>
              <input id="severity" type="range" min="1" max="10" value={severity ?? 5}
                onChange={e => setSeverity(Number(e.target.value))} className="w-full accent-[rgb(var(--accent))] mt-2" />
              <div className="flex justify-between text-[12.5px] text-dim">
                <span>{t("symptomChecker.mild")}</span><span>{t("symptomChecker.unbearable")}</span>
              </div>
            </div>
            <div>
              <label htmlFor="duration" className="field-label">{t("symptomChecker.duration")}</label>
              <select id="duration" value={duration} onChange={e => setDuration(e.target.value)} className="input-field">
                <option value="">{t("symptomChecker.selectPlaceholder")}</option>
                {DURATIONS.map(d => <option key={d} value={d}>{t(`common.durations.${d}`)}</option>)}
              </select>
            </div>

            {error && <div className="alert-error" role="alert"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

            <button onClick={submit} disabled={loading || selected.length === 0} className="btn-primary w-full !py-3.5 !text-[16px]">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("symptomChecker.analyzing")}</>
                : <><Activity className="w-4 h-4" />
                    {selected.length > 0 ? t("symptomChecker.analyze", { count: selected.length }) : t("symptomChecker.selectFirst")}</>}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
