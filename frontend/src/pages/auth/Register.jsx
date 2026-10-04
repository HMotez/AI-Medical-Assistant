import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/layout/AuthLayout";
import {
  User, Mail, Lock, Phone, CalendarDays, AlertCircle, Loader2, ArrowRight,
  CheckCircle, Shield, Zap, FileText, TrendingUp
} from "lucide-react";

const PERKS = [
  { Icon: Zap,        key: "analysis" },
  { Icon: FileText,   key: "reports" },
  { Icon: TrendingUp, key: "tracking" },
  { Icon: Shield,     key: "privacy" },
];

function Field({ id, label, icon: Icon, children }) {
  return (
    <div>
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
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm: "",
    age: "", gender: "male", phone: ""
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError(t("register.errors.mismatch")); return; }
    if (form.password.length < 8)       { setError(t("register.errors.tooShort")); return; }
    setLoading(true);
    try {
      await register({
        full_name: form.full_name, email: form.email, password: form.password,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender, phone: form.phone || undefined,
      });
      navigate("/patient");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : t("register.errors.failed"));
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
      <h2 className="text-[32px] font-bold mt-1.5">{t("register.title")}</h2>
      <p className="text-muted text-[15.5px] mt-1">{t("register.subtitle")}</p>

      {error && <div className="alert-error mt-5" role="alert"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

      <form onSubmit={handle} className="grid gap-4 mt-6">
        <Field id="reg-name" label={t("register.fullName")} icon={User}>
          <input id="reg-name" type="text" required autoComplete="name" className="input-field !pl-10"
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
          <Field id="reg-age" label={t("register.age")} icon={CalendarDays}>
            <input id="reg-age" type="number" min="1" max="120" className="input-field !pl-10"
              placeholder="25" value={form.age} onChange={set("age")} />
          </Field>
          <Field id="reg-gender" label={t("register.gender")}>
            <select id="reg-gender" className="input-field" value={form.gender} onChange={set("gender")}>
              <option value="male">{t("common.gender.male")}</option>
              <option value="female">{t("common.gender.female")}</option>
              <option value="other">{t("common.gender.other")}</option>
            </select>
          </Field>
        </div>
        <Field id="reg-phone" label={<>{t("register.phone")} <span className="text-dim font-normal">{t("common.optional")}</span></>} icon={Phone}>
          <input id="reg-phone" type="tel" className="input-field !pl-10"
            placeholder={t("register.phonePlaceholder")} value={form.phone} onChange={set("phone")} />
        </Field>

        <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 !text-[16px] mt-1">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("register.submitting")}</>
            : <>{t("register.submit")} <ArrowRight className="w-4 h-4" /></>}
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
