import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import { errorText, MB } from "../../api/files";
import { useMedicalLabels } from "../../i18n/medical";
import LABELS from "../../i18n/medical-labels.json";
import AuthLayout from "../../components/layout/AuthLayout";
import FileField from "../../components/ui/FileField";
import {
  User, Mail, Lock, Phone, CalendarDays, AlertCircle, Loader2, ArrowRight, CheckCircle, Shield, Zap,
  FileText, TrendingUp, Stethoscope, BadgeCheck, Building2, Briefcase, Info,
} from "lucide-react";
import Select from "../../components/ui/Select";

const PERKS = [
  { Icon: Zap,        key: "analysis" },
  { Icon: FileText,   key: "reports" },
  { Icon: TrendingUp, key: "tracking" },
  { Icon: Shield,     key: "privacy" },
];
const SPECIALTIES = Object.keys(LABELS.specialists).filter(s => s !== "General Practitioner");

function Field({ id, label, icon: Icon, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dim pointer-events-none" />}
        {children}
      </div>
    </div>
  );
}

export default function Register() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const asDoctor = params.get("as") === "doctor";
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm: "", age: "", gender: "male", phone: "",
    specialty: "", license_number: "", workplace: "", years_experience: "",
  });
  const [files, setFiles]     = useState({ id_card: null, diploma: null });
  const [attest, setAttest]   = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const pick = (field) => (value) => setForm(f => ({ ...f, [field]: value }));
  const chooseRole = (doctor) => { setError(""); setParams(doctor ? { as: "doctor" } : {}, { replace: true }); };
  const setFile = (kind) => (file) => {
    if (file && file.size > 5 * MB) { setError(t("register.fileTooBig", { name: file.name })); return; }
    setError("");
    setFiles(f => ({ ...f, [kind]: file }));
  };

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError(t("register.errors.mismatch")); return; }
    if (form.password.length < 8)       { setError(t("register.errors.tooShort")); return; }
    if (asDoctor && (!files.id_card || !files.diploma)) { setError(t("register.filesRequired")); return; }
    if (asDoctor && !attest) { setError(t("register.attestRequired")); return; }
    setLoading(true);
    try {
      if (asDoctor) {
        const fd = new FormData();
        ["email", "password", "full_name", "phone", "gender", "specialty", "license_number", "workplace", "years_experience"]
          .forEach(k => { if (form[k] !== "") fd.append(k, form[k]); });
        fd.append("attest", "true");
        fd.append("id_card", files.id_card);
        fd.append("diploma", files.diploma);
        await axiosClient.postForm("/api/auth/register-doctor", fd);
        await login(form.email, form.password);
        navigate("/doctor");                       // shows the verification status
      } else {
        await register({
          full_name: form.full_name, email: form.email, password: form.password,
          age: form.age ? parseInt(form.age) : undefined,
          gender: form.gender, phone: form.phone || undefined,
        });
        navigate("/patient");
      }
    } catch (err) {
      setError(errorText(err, t("register.errors.failed")));
    } finally {
      setLoading(false);
    }
  };

  const aside = (
    <>
      <span className="pill pill-glass w-fit mb-4">{t("register.badge")}</span>
      <h1 className="text-[clamp(2rem,3.4vw,2.8rem)] font-bold leading-[1.04]">
        {t("register.heroTitle1")}<br />{t("register.heroTitle2")}
      </h1>
      <p className="text-white/85 text-[15.5px] mt-3 max-w-sm">{t("register.heroText")}</p>
      <ul className="grid sm:grid-cols-2 gap-2 mt-5">
        {PERKS.map(({ Icon, key }) => (
          <li key={key} className="flex items-center gap-2 text-[14px] text-white/90">
            <span className="w-7 h-7 rounded-lg grid place-items-center bg-white/15 shrink-0"><Icon className="w-3.5 h-3.5" /></span>
            {t(`register.perks.${key}`)}
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <AuthLayout aside={aside} footer={t("register.privacyText")}>
      <div className="eyebrow">{t("register.badge")}</div>
      <h2 className="text-[32px] font-bold mt-1.5">{asDoctor ? t("register.doctorTitle") : t("register.title")}</h2>
      <p className="text-muted text-[15.5px] mt-1">{asDoctor ? t("register.doctorSubtitle") : t("register.subtitle")}</p>

      {/* Patient / doctor */}
      <div className="mt-5">
        <span className="field-label">{t("register.as")}</span>
        <div role="radiogroup" className="grid grid-cols-2 gap-1 p-1 rounded-[16px] bg-panel2">
          {[[false, User, "asPatient"], [true, Stethoscope, "asDoctor"]].map(([doctor, Icon, key]) => (
            <button key={key} type="button" role="radio" aria-checked={asDoctor === doctor} onClick={() => chooseRole(doctor)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[15px] font-semibold transition-colors
                ${asDoctor === doctor ? "bg-accent text-white shadow-glow" : "text-muted hover:text-ink"}`}>
              <Icon className="w-4 h-4" /> {t(`register.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {asDoctor && (
        <div className="alert-info mt-4 !items-start !text-[14px]"><Info className="w-4 h-4 shrink-0 mt-0.5" /> {t("register.doctorNotice")}</div>
      )}
      {error && <div className="alert-error mt-4" role="alert"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

      <form onSubmit={handle} className="grid gap-4 mt-5">
        <Field id="reg-name" label={t("register.fullName")} icon={User}>
          <input id="reg-name" type="text" required minLength={2} autoComplete="name" className="input-field !pl-10"
            placeholder={t("register.fullNamePlaceholder")} value={form.full_name} onChange={set("full_name")} />
        </Field>
        <Field id="reg-email" label={t("register.email")} icon={Mail}>
          <input id="reg-email" type="email" required autoComplete="email" className="input-field !pl-10"
            placeholder={t("login.emailPlaceholder")} value={form.email} onChange={set("email")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="reg-password" label={t("register.password")} icon={Lock}>
            <input id="reg-password" type="password" required autoComplete="new-password" className="input-field !pl-10"
              placeholder={t("register.passwordPlaceholder")} value={form.password} onChange={set("password")} />
          </Field>
          <Field id="reg-confirm" label={t("register.confirm")} icon={Lock}>
            <input id="reg-confirm" type="password" required autoComplete="new-password" className="input-field !pl-10"
              placeholder={t("register.confirmPlaceholder")} value={form.confirm} onChange={set("confirm")} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {asDoctor ? (
            <Field id="reg-phone" label={t("register.phoneRequired")} icon={Phone}>
              <input id="reg-phone" type="tel" required pattern="\+?[0-9 ().\-]{6,20}" className="input-field !pl-10"
                placeholder={t("register.phonePlaceholder")} value={form.phone} onChange={set("phone")} />
            </Field>
          ) : (
            <Field id="reg-age" label={t("register.age")} icon={CalendarDays}>
              <input id="reg-age" type="number" min="1" max="120" className="input-field !pl-10"
                placeholder="25" value={form.age} onChange={set("age")} />
            </Field>
          )}
          <Field id="reg-gender" label={t("register.gender")}>
            <Select id="reg-gender" value={form.gender} onChange={pick("gender")}
              options={["male", "female", "other"].map(g => ({ value: g, label: t(`common.gender.${g}`) }))} />
          </Field>
        </div>

        {asDoctor ? (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field id="reg-specialty" label={t("profile.specialty")}>
                <Select id="reg-specialty" required value={form.specialty} onChange={pick("specialty")} icon={Stethoscope}
                  placeholder={t("profile.chooseSpecialty")}
                  options={SPECIALTIES.map(s => ({ value: s, label: labels.specialist(s) }))} />
              </Field>
              <Field id="reg-license" label={t("profile.license")} icon={BadgeCheck}>
                <input id="reg-license" type="text" required pattern="[A-Za-z0-9\-]{5,20}" className="input-field !pl-10 font-data"
                  placeholder="10001234567" value={form.license_number} onChange={set("license_number")} />
              </Field>
              <Field id="reg-workplace" label={t("profile.workplace")} icon={Building2}>
                <input id="reg-workplace" type="text" maxLength={150} className="input-field !pl-10"
                  placeholder={t("profile.workplacePlaceholder")} value={form.workplace} onChange={set("workplace")} />
              </Field>
              <Field id="reg-years" label={t("profile.years")} icon={Briefcase}>
                <input id="reg-years" type="number" min="0" max="70" className="input-field !pl-10"
                  value={form.years_experience} onChange={set("years_experience")} />
              </Field>
            </div>
            <FileField id="reg-id" label={t("register.idCard")} file={files.id_card} onChange={setFile("id_card")} required />
            <FileField id="reg-diploma" label={t("register.diploma")} file={files.diploma} onChange={setFile("diploma")} required />
            <label className="flex items-start gap-3 rounded-[16px] bg-panel2 p-3.5 cursor-pointer">
              <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[rgb(var(--accent))] shrink-0" />
              <span className="text-[13.5px] text-muted leading-snug">{t("register.attest")}</span>
            </label>
          </>
        ) : (
          <Field id="reg-phone" label={<>{t("register.phone")} <span className="text-dim font-normal">{t("common.optional")}</span></>} icon={Phone}>
            <input id="reg-phone" type="tel" className="input-field !pl-10"
              placeholder={t("register.phonePlaceholder")} value={form.phone} onChange={set("phone")} />
          </Field>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 !text-[16px] mt-1">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("register.submitting")}</>
            : <>{asDoctor ? t("register.submitDoctor") : t("register.submit")} <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="text-center text-[13.5px] text-muted mt-4 flex items-start justify-center gap-1.5">
        <CheckCircle className="w-3.5 h-3.5 text-good shrink-0 mt-0.5" />
        <span><Trans i18nKey="register.terms" components={{
          terms: <span className="text-accent font-semibold" />,
          privacy: <span className="text-accent font-semibold" />,
        }} /></span>
      </p>

      <p className="text-center text-[15px] text-muted mt-5">
        {t("register.hasAccount")}{" "}
        <Link to="/login" className="text-accent font-semibold hover:underline">{t("register.loginLink")}</Link>
      </p>
    </AuthLayout>
  );
}
