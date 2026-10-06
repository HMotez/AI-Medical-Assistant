import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/layout/AuthLayout";
import { Mail, Lock, AlertCircle, Loader2, ArrowRight, Shield, Activity, Search, Award } from "lucide-react";

const STATS = [
  { Icon: Search,   value: "131",  key: "symptoms" },
  { Icon: Activity, value: "41",   key: "diseases" },
  { Icon: Award,    value: "95%",  key: "accuracy" },
];

// The public deployment only has the shared demo patient; the demo doctor and
// admin exist on a local installation (see backend/app/utils/create_admin.py).
const LOCAL = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const DEMO = [
  ["patient", "patient@medai.com", "Patient@1234"],
  ...(LOCAL ? [
    ["doctor", "doctor@medai.com", "Doctor@1234"],
    ["admin",  "admin@medai.com",  "Admin@1234"],
  ] : []),
];

export default function Login() {
  const { t } = useTranslation();
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : user.role === "doctor" ? "/doctor" : "/patient");
    } catch (err) {
      setError(err.response?.status === 401 || !err.response?.data?.detail ? t("login.error") : err.response.data.detail);
    } finally {
      setLoading(false);
    }
  };

  const aside = (
    <>
      <span className="pill pill-glass w-fit mb-4"><Shield className="w-3.5 h-3.5" /> {t("login.badge")}</span>
      <h1 className="text-[clamp(2rem,3.4vw,2.8rem)] font-bold leading-[1.04]">
        {t("login.heroTitle1")}<br />{t("login.heroTitle2")}
      </h1>
      <p className="text-white/85 text-[15.5px] mt-3 max-w-sm">{t("login.heroText")}</p>
      <div className="flex flex-wrap gap-2 mt-5">
        {STATS.map(({ Icon, value, key }) => (
          <span key={key} className="pill pill-glass"><Icon className="w-3.5 h-3.5" /> <b className="font-data">{value}</b> {t(`login.stats.${key}`)}</span>
        ))}
      </div>
    </>
  );

  return (
    <AuthLayout aside={aside} footer={t("login.footer")}>
      <div className="eyebrow">{t("common.appName")}</div>
      <h2 className="text-[32px] font-bold mt-1.5">{t("login.title")}</h2>
      <p className="text-muted text-[15.5px] mt-1">{t("login.subtitle")}</p>

      {error && <div className="alert-error mt-5" role="alert"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

      <form onSubmit={handle} className="grid gap-4 mt-6">
        <div>
          <label htmlFor="login-email" className="field-label">{t("login.email")}</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
            <input id="login-email" type="email" required autoComplete="email" className="input-field !pl-10"
              placeholder={t("login.emailPlaceholder")}
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div>
          <label htmlFor="login-password" className="field-label">{t("login.password")}</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
            <input id="login-password" type="password" required autoComplete="current-password" className="input-field !pl-10"
              placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 !text-[16px] mt-1">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("login.submitting")}</>
            : <>{t("login.submit")} <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      {/* Demo accounts: click to fill the form */}
      <div className="mt-6 rounded-2xl bg-panel2 p-4">
        <p className="eyebrow !text-muted mb-2">{t("login.demoAccounts")}</p>
        <div className="grid gap-1.5">
          {DEMO.map(([role, email, password]) => (
            <button key={role} type="button" onClick={() => setForm({ email, password })}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left hover:bg-panel transition-colors">
              <span className="chip chip-accent">{t(`common.roles.${role}`)}</span>
              <span className="font-data text-[12.5px] text-muted truncate">{email}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-[15px] text-muted mt-6">
        {t("login.noAccount")}{" "}
        <Link to="/register" className="text-accent font-semibold hover:underline">{t("login.registerLink")}</Link>
      </p>
    </AuthLayout>
  );
}
