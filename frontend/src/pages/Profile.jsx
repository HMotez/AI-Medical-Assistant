import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import { cropToSquare, errorText, openDocument, MB } from "../api/files";
import { dateLocale } from "../i18n";
import { useMedicalLabels } from "../i18n/medical";
import LABELS from "../i18n/medical-labels.json";
import PageHead from "../components/ui/PageHead";
import Avatar from "../components/ui/Avatar";
import {
  User, Mail, Phone, CalendarDays, Save, Trash2, CheckCircle, AlertCircle, Loader2, Shield, Camera,
  MapPin, HeartPulse, Droplet, Ruler, Weight, PhoneCall, Stethoscope, BadgeCheck, Building2,
  Briefcase, Lock, KeyRound, FileText, Clock, XCircle, Eye,
} from "lucide-react";
import Select from "../components/ui/Select";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SPECIALTIES = Object.keys(LABELS.specialists).filter(s => s !== "General Practitioner");

const FIELDS = {
  common:  ["full_name", "age", "gender", "phone", "city", "bio"],
  patient: ["blood_type", "height_cm", "weight_kg", "allergies", "chronic_conditions", "medications",
            "emergency_contact_name", "emergency_contact_phone"],
  doctor:  ["specialty", "license_number", "workplace", "years_experience"],
};
// What counts toward "profile complete", per role
const COMPLETION = {
  patient: ["photo", "phone", "age", "gender", "city", "blood_type", "height_cm", "weight_kg", "emergency"],
  doctor:  ["photo", "phone", "gender", "city", "bio", "specialty", "license_number", "workplace", "years_experience"],
  admin:   ["photo", "phone", "city"],
};
const NUMBER_FIELDS = new Set(["age", "height_cm", "weight_kg", "years_experience"]);

const STATUS_STYLE = {
  approved: { Icon: BadgeCheck, cls: "chip-good" },
  pending:  { Icon: Clock,      cls: "!bg-warn/15 !text-warn" },
  rejected: { Icon: XCircle,    cls: "!bg-bad/10 !text-bad" },
};

function Field({ id, label, icon: Icon, hint, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-[22px] -translate-y-1/2 w-4 h-4 text-dim pointer-events-none" />}
        {children}
      </div>
      {hint && <p className="text-[12.5px] text-dim mt-1">{hint}</p>}
    </div>
  );
}

function Section({ icon: Icon, title, hint, children }) {
  return (
    <section className="card grid gap-4">
      <div className="card-head !mb-0">
        <div className="card-icon"><Icon className="w-5 h-5" /></div>
        <div><h2>{title}</h2>{hint && <small>{hint}</small>}</div>
      </div>
      {children}
    </section>
  );
}

function bmiOf(heightCm, weightKg) {
  const h = Number(heightCm) / 100, w = Number(weightKg);
  if (!h || !w) return null;
  const value = w / (h * h);
  const key = value < 18.5 ? "under" : value < 25 ? "normal" : value < 30 ? "over" : "obese";
  const tone = key === "normal" ? "good" : key === "obese" ? "bad" : "warn";
  return { value: value.toFixed(1), key, tone };
}

const toForm = (user) => Object.fromEntries(
  [...FIELDS.common, ...FIELDS.patient, ...FIELDS.doctor].map(k => [k, user?.[k] ?? ""]),
);

export default function Profile() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "patient";
  const isPatient = role === "patient", isDoctor = role === "doctor";
  const licenseLocked = isDoctor && user?.doctor_status === "approved";

  const [form, setForm]         = useState(() => toForm(user));
  const [saving, setSaving]     = useState(false);
  const [notice, setNotice]     = useState(null);       // { type, text }
  const [photoBusy, setPhotoBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pw, setPw]             = useState({ current: "", next: "", confirm: "" });
  const [pwState, setPwState]   = useState(null);       // { type, text }
  const [pwBusy, setPwBusy]     = useState(false);
  const photoInput = useRef(null);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const pick = (field) => (value) => setForm(f => ({ ...f, [field]: value }));
  const flash = (type, text) => { setNotice({ type, text }); if (type === "success") setTimeout(() => setNotice(null), 4000); };

  // ── Save the profile ──
  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setNotice(null);
    const keys = [...FIELDS.common, ...(isPatient ? FIELDS.patient : []), ...(isDoctor ? FIELDS.doctor : [])]
      .filter(k => !(k === "license_number" && licenseLocked));
    const body = Object.fromEntries(keys.map(k => {
      const v = form[k];
      if (v === "" || v === null) return [k, null];
      return [k, NUMBER_FIELDS.has(k) ? Number(v) : v];
    }));
    try {
      const { data } = await axiosClient.put("/api/users/me", body);
      setUser(data);
      setForm(toForm(data));
      flash("success", t("profile.saved"));
    } catch (err) {
      flash("error", errorText(err, t("profile.saveError")));
    } finally {
      setSaving(false);
    }
  };

  // ── Photo ──
  const pickPhoto = async (file) => {
    if (!file) return;
    setPhotoBusy(true); setNotice(null);
    try {
      const blob = await cropToSquare(file);
      if (blob.size > 2 * MB) throw new Error("big");
      const fd = new FormData();
      fd.append("file", blob, "avatar.jpg");
      const { data } = await axiosClient.postForm("/api/users/me/avatar", fd);
      setUser(data);
    } catch (err) {
      flash("error", err.message === "big" ? t("profile.photo.tooBig") : errorText(err, t("profile.photo.error")));
    } finally {
      setPhotoBusy(false);
    }
  };
  const removePhoto = async () => {
    setPhotoBusy(true);
    try { const { data } = await axiosClient.delete("/api/users/me/avatar"); setUser(data); }
    catch (err) { flash("error", errorText(err, t("profile.photo.error"))); }
    finally { setPhotoBusy(false); }
  };

  // ── Password ──
  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.next.length < 8) { setPwState({ type: "error", text: t("profile.passwordTooShort") }); return; }
    if (pw.next !== pw.confirm) { setPwState({ type: "error", text: t("profile.passwordMismatch") }); return; }
    setPwBusy(true); setPwState(null);
    try {
      await axiosClient.put("/api/users/me/password", { current_password: pw.current, new_password: pw.next });
      setPw({ current: "", next: "", confirm: "" });
      setPwState({ type: "success", text: t("profile.passwordChanged") });
    } catch (err) {
      setPwState({ type: "error", text: errorText(err, t("profile.saveError")) });
    } finally {
      setPwBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm(t("profile.confirmDelete"))) return;
    setDeleting(true);
    try { await axiosClient.delete("/api/users/me"); logout(); navigate("/"); }
    catch { flash("error", t("profile.deleteError")); }
    finally { setDeleting(false); }
  };

  // ── Completion ──
  const filled = (k) => k === "photo" ? !!user?.avatar_url
    : k === "emergency" ? !!(user?.emergency_contact_name && user?.emergency_contact_phone)
    : user?.[k] !== null && user?.[k] !== undefined && user?.[k] !== "";
  const checks = COMPLETION[role] || COMPLETION.patient;
  const missing = checks.filter(k => !filled(k));
  const percent = Math.round(((checks.length - missing.length) / checks.length) * 100);

  const bmi = bmiOf(form.height_cm, form.weight_kg);
  const status = isDoctor ? (user?.doctor_status || "pending") : null;
  const StatusIcon = status && STATUS_STYLE[status]?.Icon;
  const memberSince = user?.created_at && new Date(user.created_at).toLocaleDateString(dateLocale(), { month: "long", year: "numeric" });

  return (
    <div className="grid gap-4">
      <PageHead eyebrow={t("profile.settings")} title={t("profile.title")} subtitle={user?.email} />

      {/* Identity */}
      <section className="card !p-0 overflow-hidden">
        <div className="h-24 relative" style={{ background: "var(--hero)" }} aria-hidden="true">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.5) 1px, transparent 1.4px)", backgroundSize: "18px 18px" }} />
        </div>
        <div className="relative px-6 pb-6 flex flex-wrap items-start gap-5">
          <div className="relative -mt-14">
            <Avatar user={user} size={120} ring />
            <button type="button" onClick={() => photoInput.current?.click()} disabled={photoBusy}
              aria-label={user?.avatar_url ? t("profile.photo.change") : t("profile.photo.add")}
              className="absolute -right-2 -bottom-2 w-10 h-10 rounded-full grid place-items-center bg-accent text-white shadow-glow ring-4 ring-panel hover:brightness-110 transition">
              {photoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
              onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
          </div>

          <div className="flex-1 min-w-[220px] pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[26px] font-bold leading-tight">{user?.full_name}</h2>
              <span className="chip chip-accent">{t(`common.roles.${role}`)}</span>
              {status && <span className={`chip ${STATUS_STYLE[status].cls}`}><StatusIcon className="w-3.5 h-3.5" /> {t(`verification.status.${status}`)}</span>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[14px] text-muted">
              {isDoctor && user?.specialty && <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> {labels.specialist(user.specialty)}</span>}
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user?.email}</span>
              {user?.city && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {user.city}</span>}
              {memberSince && <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {t("profile.memberSince", { date: memberSince })}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[12.5px] text-dim">
              <span>{t("profile.photo.hint")}</span>
              {user?.avatar_url && (
                <button type="button" onClick={removePhoto} disabled={photoBusy} className="text-bad font-semibold hover:underline">
                  {t("profile.photo.remove")}
                </button>
              )}
            </div>
          </div>

          {/* Completion meter */}
          <div className="w-full md:w-[300px] rounded-[20px] bg-panel2 p-4 mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[14px] font-medium text-muted">{t("profile.completion.title")}</span>
              <span className="text-[24px] font-semibold text-ink">{percent}<span className="text-[14px] text-muted ml-0.5">%</span></span>
            </div>
            <div className="h-1.5 rounded-full mt-2 overflow-hidden bg-accent/15" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={t("profile.completion.title")}>
              <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${percent}%`, background: percent === 100 ? "rgb(var(--good))" : "rgb(var(--accent))" }} />
            </div>
            <p className="text-[12.5px] text-muted mt-2 leading-snug">
              {missing.length === 0 ? t("profile.completion.done")
                : t("profile.completion.missing", { items: missing.map(k => t(`profile.fields.${k}`)).join(", ") })}
            </p>
          </div>
        </div>
      </section>

      {notice && (
        <div className={notice.type === "success" ? "alert-success" : "alert-error"} role={notice.type === "success" ? "status" : "alert"}>
          {notice.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />} {notice.text}
        </div>
      )}

      <div className="grid xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4 items-start">
        {/* ── Editable profile ── */}
        <form onSubmit={save} className="grid gap-4">
          <Section icon={User} title={t("profile.personalInfo")}>
            <Field id="p-email" label={<>{t("profile.email")} <span className="text-dim font-normal">{t("profile.emailLocked")}</span></>} icon={Mail}>
              <input id="p-email" type="email" readOnly value={user?.email || ""} className="input-field !pl-10" />
            </Field>
            <Field id="p-name" label={t("profile.fullName")} icon={User}>
              <input id="p-name" type="text" required minLength={2} maxLength={100} className="input-field !pl-10"
                placeholder={t("profile.fullNamePlaceholder")} value={form.full_name} onChange={set("full_name")} />
            </Field>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field id="p-age" label={t("profile.age")} icon={CalendarDays}>
                <input id="p-age" type="number" min="1" max="120" className="input-field !pl-10" value={form.age} onChange={set("age")} />
              </Field>
              <Field id="p-gender" label={t("profile.gender")}>
                <Select id="p-gender" value={form.gender} onChange={pick("gender")} placeholder="—"
                  options={["male", "female", "other"].map(g => ({ value: g, label: t(`common.gender.${g}`) }))} />
              </Field>
              <Field id="p-city" label={t("profile.city")} icon={MapPin}>
                <input id="p-city" type="text" maxLength={100} className="input-field !pl-10"
                  placeholder={t("profile.cityPlaceholder")} value={form.city} onChange={set("city")} />
              </Field>
            </div>
            <Field id="p-phone" label={t("profile.phone")} icon={Phone}>
              <input id="p-phone" type="tel" pattern="\+?[0-9 ().\-]{6,20}" className="input-field !pl-10"
                placeholder={t("register.phonePlaceholder")} value={form.phone} onChange={set("phone")} />
            </Field>
            <Field id="p-bio" label={t("profile.bio")}>
              <textarea id="p-bio" rows={3} maxLength={600} className="input-field resize-y"
                placeholder={t(isDoctor ? "profile.bioPlaceholderDoctor" : "profile.bioPlaceholderPatient")}
                value={form.bio} onChange={set("bio")} />
            </Field>
          </Section>

          {isPatient && (
            <>
              <Section icon={HeartPulse} title={t("profile.medicalInfo")} hint={t("profile.medicalHint")}>
                <div className="grid sm:grid-cols-3 gap-3">
                  <Field id="p-blood" label={t("profile.bloodType")}>
                    <Select id="p-blood" value={form.blood_type} onChange={pick("blood_type")} icon={Droplet} placeholder={t("profile.unknown")}
                      options={[{ value: "", label: t("profile.unknown") }, ...BLOOD_TYPES.map(b => ({ value: b, label: b }))]} />
                  </Field>
                  <Field id="p-height" label={t("profile.height")} icon={Ruler}>
                    <input id="p-height" type="number" min="40" max="250" className="input-field !pl-10" value={form.height_cm} onChange={set("height_cm")} />
                  </Field>
                  <Field id="p-weight" label={t("profile.weight")} icon={Weight}>
                    <input id="p-weight" type="number" min="2" max="400" step="0.1" className="input-field !pl-10" value={form.weight_kg} onChange={set("weight_kg")} />
                  </Field>
                </div>
                {bmi && (
                  <div className="flex items-center gap-3 rounded-[16px] bg-panel2 px-4 py-3">
                    <span className="text-[14px] text-muted">{t("profile.bmi")}</span>
                    <span className="text-[22px] font-semibold text-ink">{bmi.value}</span>
                    <span className="chip" style={{ background: `rgb(var(--${bmi.tone}) / 0.14)`, color: `rgb(var(--${bmi.tone}))` }}>
                      {t(`profile.bmiCategory.${bmi.key}`)}
                    </span>
                  </div>
                )}
                {[["allergies", "allergies"], ["chronic_conditions", "conditions"], ["medications", "medications"]].map(([k, key]) => (
                  <Field key={k} id={`p-${k}`} label={t(`profile.${key}`)}>
                    <textarea id={`p-${k}`} rows={2} maxLength={500} className="input-field resize-y"
                      placeholder={t(`profile.${key}Placeholder`)} value={form[k]} onChange={set(k)} />
                  </Field>
                ))}
              </Section>

              <Section icon={PhoneCall} title={t("profile.emergency")}>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field id="p-ec-name" label={t("profile.emergencyName")} icon={User}>
                    <input id="p-ec-name" type="text" maxLength={100} className="input-field !pl-10" value={form.emergency_contact_name} onChange={set("emergency_contact_name")} />
                  </Field>
                  <Field id="p-ec-phone" label={t("profile.emergencyPhone")} icon={Phone}>
                    <input id="p-ec-phone" type="tel" pattern="\+?[0-9 ().\-]{6,20}" className="input-field !pl-10" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} />
                  </Field>
                </div>
              </Section>
            </>
          )}

          {isDoctor && (
            <Section icon={Stethoscope} title={t("profile.professional")} hint={t("profile.professionalHint")}>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field id="p-specialty" label={t("profile.specialty")}>
                  <Select id="p-specialty" value={form.specialty} onChange={pick("specialty")} icon={Stethoscope}
                    placeholder={t("profile.chooseSpecialty")}
                    options={SPECIALTIES.map(s => ({ value: s, label: labels.specialist(s) }))} />
                </Field>
                <Field id="p-license" label={t("profile.license")} icon={licenseLocked ? Lock : BadgeCheck}
                  hint={licenseLocked ? t("profile.licenseLocked") : null}>
                  <input id="p-license" type="text" readOnly={licenseLocked} pattern="[A-Za-z0-9\-]{5,20}" className="input-field !pl-10 font-data"
                    value={form.license_number} onChange={set("license_number")} />
                </Field>
                <Field id="p-workplace" label={t("profile.workplace")} icon={Building2}>
                  <input id="p-workplace" type="text" maxLength={150} className="input-field !pl-10"
                    placeholder={t("profile.workplacePlaceholder")} value={form.workplace} onChange={set("workplace")} />
                </Field>
                <Field id="p-years" label={t("profile.years")} icon={Briefcase}>
                  <input id="p-years" type="number" min="0" max="70" className="input-field !pl-10" value={form.years_experience} onChange={set("years_experience")} />
                </Field>
              </div>
            </Section>
          )}

          <div className="sticky bottom-0 z-10 flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary !px-6 shadow-elev2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t("profile.save")}
            </button>
          </div>
        </form>

        {/* ── Side column ── */}
        <div className="grid gap-4">
          {isDoctor && <DoctorDocuments user={user} />}

          <section className="card">
            <div className="card-head">
              <div className="card-icon"><Shield className="w-5 h-5" /></div>
              <div><h2>{t("profile.passwordTitle")}</h2><small>{t("profile.security")}</small></div>
            </div>
            <form onSubmit={changePassword} className="grid gap-3">
              {pwState && (
                <div className={pwState.type === "success" ? "alert-success" : "alert-error"} role="status">
                  {pwState.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />} {pwState.text}
                </div>
              )}
              {[["current", "currentPassword", "current-password"], ["next", "newPassword", "new-password"], ["confirm", "confirmPassword", "new-password"]].map(([k, key, ac]) => (
                <Field key={k} id={`pw-${k}`} label={t(`profile.${key}`)} icon={KeyRound}>
                  <input id={`pw-${k}`} type="password" required autoComplete={ac} className="input-field !pl-10"
                    value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} />
                </Field>
              ))}
              <div>
                <button type="submit" disabled={pwBusy} className="btn-outline">
                  {pwBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} {t("profile.updatePassword")}
                </button>
              </div>
            </form>
          </section>

          {role !== "admin" && (
            <section className="card" style={{ boxShadow: "var(--elev-1), inset 0 0 0 1px rgb(var(--bad) / 0.25)" }}>
              <div className="card-head">
                <div className="card-icon !text-bad !bg-bad/10"><AlertCircle className="w-5 h-5" /></div>
                <div><h2 className="!text-bad">{t("profile.danger")}</h2><small>{t("profile.deleteTitle")}</small></div>
              </div>
              <p className="text-muted text-[14.5px] mb-4">{t("profile.deleteText")}</p>
              <button onClick={deleteAccount} disabled={deleting} className="btn-danger">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} {t("profile.deleteButton")}
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/** A doctor's verification documents, viewable by the doctor. */
function DoctorDocuments({ user }) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    axiosClient.get("/api/users/me/documents").then(r => setDocs(r.data)).catch(() => setDocs([]));
  }, [user?.doctor_status]);
  return (
    <section className="card">
      <div className="card-head">
        <div className="card-icon"><FileText className="w-5 h-5" /></div>
        <div><h2>{t("profile.documents")}</h2><small>{t(`verification.status.${user?.doctor_status || "pending"}`)}</small></div>
      </div>
      <div className="grid gap-2">
        {docs.map(d => (
          <div key={d.id} className="flex items-center gap-3 rounded-[16px] bg-panel2 px-3.5 py-2.5">
            <FileText className="w-4 h-4 text-accent shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-semibold">{t(`verification.kinds.${d.kind}`)}</div>
              <div className="text-[12.5px] text-muted truncate">{d.original_name}</div>
            </div>
            <button type="button" onClick={() => openDocument(d.id).catch(() => {})} className="btn-ghost btn-sm">
              <Eye className="w-3.5 h-3.5" /> {t("verification.view")}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
