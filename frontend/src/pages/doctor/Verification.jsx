import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import { errorText, openDocument, MB } from "../../api/files";
import { dateLocale } from "../../i18n";
import PageHead from "../../components/ui/PageHead";
import FileField from "../../components/ui/FileField";
import {
  CheckCircle, Clock, XCircle, FileText, Eye, Upload, Loader2, AlertCircle, UserCog, Lock,
} from "lucide-react";

const KINDS = ["id_card", "diploma"];

/** What a doctor sees while their account is not verified yet (or was refused). */
export default function Verification() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [docs, setDocs]       = useState([]);
  const [files, setFiles]     = useState({});
  const [busy, setBusy]       = useState(null);
  const [message, setMessage] = useState(null);
  const status = user?.doctor_status || "pending";
  const rejected = status === "rejected";

  const loadDocs = () => axiosClient.get("/api/users/me/documents").then(r => setDocs(r.data)).catch(() => {});
  useEffect(() => { loadDocs(); }, []);
  // Pick up the administrator's decision without a reload
  useEffect(() => {
    const id = setInterval(() => refreshUser().catch(() => {}), 30000);
    return () => clearInterval(id);
  }, [refreshUser]);

  const send = async (kind) => {
    const file = files[kind];
    if (!file) return;
    if (file.size > 5 * MB) { setMessage({ type: "error", text: t("register.fileTooBig", { name: file.name }) }); return; }
    setBusy(kind); setMessage(null);
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);
      await axiosClient.postForm("/api/users/me/documents", fd);
      setFiles(f => ({ ...f, [kind]: null }));
      await Promise.all([loadDocs(), refreshUser()]);
      setMessage({ type: "success", text: t("verification.sent") });
    } catch (err) {
      setMessage({ type: "error", text: errorText(err, t("register.errors.failed")) });
    } finally {
      setBusy(null);
    }
  };

  const fmt = (d) => new Date(d).toLocaleDateString(dateLocale(), { dateStyle: "medium" });
  const steps = [
    { key: "account",   state: "done" },
    { key: "documents", state: docs.length >= KINDS.length ? "done" : "current" },
    { key: "review",    state: rejected ? "failed" : "current" },
    { key: "access",    state: "locked" },
  ];
  const STEP_ICON = { done: CheckCircle, current: Clock, failed: XCircle, locked: Lock };
  const STEP_TONE = { done: "good", current: "warn", failed: "bad", locked: "dim" };

  return (
    <div className="grid gap-4">
      <PageHead eyebrow={t("verification.eyebrow")} title={t("verification.title")} subtitle={user?.email} />

      <section className="card grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-start">
        <div>
          <div className={`w-14 h-14 rounded-2xl grid place-items-center ${rejected ? "bg-bad/10 text-bad" : "bg-warn/15 text-warn"}`}>
            {rejected ? <XCircle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
          </div>
          <h2 className="text-[24px] font-bold mt-4 leading-tight">{t(rejected ? "verification.rejected" : "verification.pending")}</h2>
          <p className="text-muted text-[15px] mt-2">{t(rejected ? "verification.rejectedText" : "verification.pendingText")}</p>
          {rejected && user?.doctor_review_note && (
            <div className="alert-error mt-4 !items-start"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>{t("verification.reason")} :</strong> {user.doctor_review_note}</span>
            </div>
          )}
          <Link to="/doctor/profile" className="btn-ghost mt-5"><UserCog className="w-4 h-4" /> {t("verification.profileLink")}</Link>
        </div>

        {/* Steps */}
        <ol className="grid gap-1">
          {steps.map(({ key, state }, i) => {
            const Icon = STEP_ICON[state];
            const tone = STEP_TONE[state];
            return (
              <li key={key} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className="w-9 h-9 rounded-full grid place-items-center shrink-0"
                    style={{ background: `rgb(var(--${tone}) / 0.14)`, color: `rgb(var(--${tone}))` }}>
                    <Icon className={`w-[18px] h-[18px] ${state === "current" ? "animate-pulse" : ""}`} />
                  </span>
                  {i < steps.length - 1 && <span className="w-px flex-1 min-h-[18px] bg-line my-1" />}
                </div>
                <div className="pt-1.5 pb-3">
                  <div className={`text-[15.5px] font-semibold ${state === "locked" ? "text-dim" : "text-ink"}`}>{t(`verification.steps.${key}`)}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {message && (
        <div className={message.type === "success" ? "alert-success" : "alert-error"} role="status">
          {message.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />} {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {KINDS.map(kind => {
          const doc = docs.find(d => d.kind === kind);
          return (
            <section key={kind} className="card grid gap-3">
              <div className="card-head !mb-0">
                <div className="card-icon"><FileText className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <h2>{t(`verification.kinds.${kind}`)}</h2>
                  <small className="truncate">{doc ? t("verification.uploaded", { date: fmt(doc.uploaded_at) }) : "—"}</small>
                </div>
                {doc && (
                  <button type="button" onClick={() => openDocument(doc.id).catch(() => {})} className="btn-ghost btn-sm">
                    <Eye className="w-3.5 h-3.5" /> {t("verification.view")}
                  </button>
                )}
              </div>
              {doc && <p className="text-[13.5px] text-muted truncate">{doc.original_name}</p>}
              {rejected && (
                <>
                  <FileField id={`re-${kind}`} label={t("register.replaceFile")} file={files[kind]}
                    onChange={(f) => setFiles(prev => ({ ...prev, [kind]: f }))} />
                  <div>
                    <button type="button" onClick={() => send(kind)} disabled={!files[kind] || busy === kind} className="btn-primary btn-sm">
                      {busy === kind ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} {t("verification.resend")}
                    </button>
                  </div>
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
