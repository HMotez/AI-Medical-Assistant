import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import { errorText, formatSize, openDocument } from "../../api/files";
import { dateLocale } from "../../i18n";
import { useMedicalLabels } from "../../i18n/medical";
import PageHead from "../../components/ui/PageHead";
import Avatar from "../../components/ui/Avatar";
import PageSkeleton from "../../components/ui/Skeleton";
import {
  BadgeCheck, XCircle, Clock, FileText, Image as ImageIcon, Eye, Mail, Phone, Stethoscope, Building2,
  Briefcase, Loader2, CheckCircle, AlertCircle, ExternalLink, ShieldCheck,
} from "lucide-react";

const TABS = [
  { key: "pending",  Icon: Clock },
  { key: "approved", Icon: BadgeCheck },
  { key: "rejected", Icon: XCircle },
];

/** Admin: check each doctor applicant's identity card and diploma, then approve or reject. */
export default function AdminVerifications() {
  const { t } = useTranslation();
  const [tab, setTab]         = useState("pending");
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    axiosClient.get("/api/admin/doctor-requests", { params: { status_filter: tab } })
      .then(r => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const done = (text) => { setNotice({ type: "success", text }); load(); window.dispatchEvent(new Event("verifications-changed")); };

  return (
    <div className="grid gap-4">
      <PageHead eyebrow={t("adminVerify.eyebrow")} title={t("adminVerify.title")} subtitle={t("adminVerify.subtitle")} />

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" className="inline-flex gap-1 p-1 rounded-[14px] bg-panel2">
          {TABS.map(({ key, Icon }) => (
            <button key={key} role="tab" aria-selected={tab === key} onClick={() => { setTab(key); setNotice(null); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14.5px] font-semibold transition-colors
                ${tab === key ? "bg-accent text-white shadow-glow" : "text-muted hover:text-ink"}`}>
              <Icon className="w-4 h-4" /> {t(`adminVerify.tabs.${key}`)}
            </button>
          ))}
        </div>
        <p className="text-[13.5px] text-muted flex items-center gap-1.5 flex-1 min-w-[240px]">
          <ShieldCheck className="w-4 h-4 text-accent shrink-0" /> {t("adminVerify.checklist")}{" "}
          <a href="https://annuaire.sante.fr" target="_blank" rel="noreferrer" className="text-accent font-semibold hover:underline inline-flex items-center gap-1">
            {t("adminVerify.directory")} <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      {notice && (
        <div className={notice.type === "success" ? "alert-success" : "alert-error"} role="status">
          {notice.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />} {notice.text}
        </div>
      )}

      {loading ? (
        <PageSkeleton tiles={0} cards={1} rows={5} />
      ) : items.length === 0 ? (
        <div className="card text-center !py-14">
          <div className="card-icon mx-auto"><BadgeCheck className="w-5 h-5" /></div>
          <p className="text-muted mt-3">{t("adminVerify.empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(doc => (
            <RequestCard key={doc.id} doctor={doc} onDone={done} onError={(text) => setNotice({ type: "error", text })} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({ doctor, onDone, onError }) {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason]       = useState("");
  const [busy, setBusy]           = useState(null);
  const fmt = (d) => new Date(d).toLocaleDateString(dateLocale(), { dateStyle: "medium" });
  const status = doctor.doctor_status;

  const act = async (approve) => {
    setBusy(approve ? "approve" : "reject");
    try {
      if (approve) await axiosClient.post(`/api/admin/doctors/${doctor.id}/approve`);
      else await axiosClient.post(`/api/admin/doctors/${doctor.id}/reject`, { reason });
      onDone(t(approve ? "adminVerify.approved" : "adminVerify.rejectedDone", { name: doctor.full_name }));
    } catch (err) {
      onError(errorText(err, t("register.errors.failed")));
    } finally {
      setBusy(null);
    }
  };

  const facts = [
    [Mail, doctor.email],
    [Phone, doctor.phone],
    [Stethoscope, doctor.specialty && labels.specialist(doctor.specialty)],
    [Building2, doctor.workplace],
    [Briefcase, doctor.years_experience != null && t("adminVerify.years", { count: doctor.years_experience })],
  ].filter(([, v]) => v);

  return (
    <section className="card grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
      <div className="min-w-0">
        <div className="flex items-center gap-3.5">
          <Avatar user={doctor} size={56} />
          <div className="min-w-0">
            <h2 className="text-[19px] font-bold truncate">{doctor.full_name}</h2>
            <div className="text-[13.5px] text-muted">
              {status === "pending" ? t("adminVerify.submitted", { date: fmt(doctor.created_at) })
                : doctor.doctor_reviewed_at && t("adminVerify.reviewed", { date: fmt(doctor.doctor_reviewed_at) })}
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-[16px] bg-panel2 px-4 py-3">
          <div className="text-[12.5px] uppercase tracking-[0.14em] text-dim">{t("profile.license")}</div>
          <div className="font-data text-[18px] text-ink mt-0.5">{doctor.license_number || "—"}</div>
        </div>
        <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-[14px]">
          {facts.map(([Icon, value], i) => (
            <li key={i} className="flex items-center gap-2 min-w-0"><Icon className="w-3.5 h-3.5 text-dim shrink-0" /><span className="truncate">{value}</span></li>
          ))}
        </ul>
        {status === "rejected" && doctor.doctor_review_note && (
          <p className="alert-error mt-3 !text-[13.5px]"><XCircle className="w-4 h-4 shrink-0" /> {doctor.doctor_review_note}</p>
        )}
      </div>

      <div className="grid gap-3 content-start">
        {doctor.documents.map(d => {
          const Icon = d.content_type === "application/pdf" ? FileText : ImageIcon;
          return (
            <div key={d.id} className="flex items-center gap-3 rounded-[16px] border border-line bg-panel px-3.5 py-3">
              <span className="w-10 h-10 rounded-xl grid place-items-center bg-accent/12 text-accent shrink-0"><Icon className="w-5 h-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold">{t(`verification.kinds.${d.kind}`)}</div>
                <div className="text-[12.5px] text-muted truncate">{d.original_name} · {formatSize(d.size)}</div>
              </div>
              <button type="button" onClick={() => openDocument(d.id).catch(() => onError(t("register.errors.failed")))} className="btn-ghost btn-sm">
                <Eye className="w-3.5 h-3.5" /> {t("verification.view")}
              </button>
            </div>
          );
        })}

        {status === "pending" && !rejecting && (
          <div className="flex flex-wrap gap-2 mt-1">
            <button type="button" onClick={() => act(true)} disabled={!!busy} className="btn-primary !bg-good">
              {busy === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />} {t("adminVerify.approve")}
            </button>
            <button type="button" onClick={() => setRejecting(true)} disabled={!!busy} className="btn-ghost !text-bad">
              <XCircle className="w-4 h-4" /> {t("adminVerify.reject")}
            </button>
          </div>
        )}
        {status === "pending" && rejecting && (
          <div className="grid gap-2 mt-1">
            <label htmlFor={`reason-${doctor.id}`} className="field-label !mb-0">{t("adminVerify.rejectReason")}</label>
            <textarea id={`reason-${doctor.id}`} rows={2} maxLength={500} className="input-field resize-y" autoFocus
              value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => act(false)} disabled={reason.trim().length < 3 || !!busy} className="btn-danger">
                {busy === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} {t("adminVerify.confirmReject")}
              </button>
              <button type="button" onClick={() => { setRejecting(false); setReason(""); }} className="btn-ghost">{t("adminVerify.cancel")}</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
