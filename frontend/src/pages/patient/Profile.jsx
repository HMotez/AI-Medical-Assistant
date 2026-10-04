import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import PageHead from "../../components/ui/PageHead";
import { User, Mail, Phone, CalendarDays, Save, Trash2, CheckCircle, AlertCircle, Loader2, Shield } from "lucide-react";

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

export default function Profile() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    age:       user?.age || "",
    gender:    user?.gender || "male",
    phone:     user?.phone || "",
  });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess(false);
    try {
      await axiosClient.put("/api/users/me", {
        full_name: form.full_name,
        age:       form.age ? parseInt(form.age) : undefined,
        gender:    form.gender,
        phone:     form.phone || undefined,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : t("profile.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm(t("profile.confirmDelete"))) return;
    setDeleting(true);
    try {
      await axiosClient.delete("/api/users/me");
      logout();
      navigate("/");
    } catch {
      setError(t("profile.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHead eyebrow={t("profile.settings")} title={t("profile.title")} subtitle={user?.email} />

      <div className="grid xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <form onSubmit={save} className="card grid gap-4">
          <div className="card-head !mb-1">
            <div className="card-icon"><User className="w-5 h-5" /></div>
            <h2>{t("profile.personalInfo")}</h2>
          </div>

          {success && <div className="alert-success" role="status"><CheckCircle className="w-4 h-4 shrink-0" /> {t("profile.saved")}</div>}
          {error && <div className="alert-error" role="alert"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

          <Field id="profile-email" label={<>{t("profile.email")} <span className="text-dim font-normal">{t("profile.emailLocked")}</span></>} icon={Mail}>
            <input id="profile-email" type="email" readOnly value={user?.email || ""} className="input-field !pl-10" />
          </Field>
          <Field id="profile-name" label={t("profile.fullName")} icon={User}>
            <input id="profile-name" type="text" required className="input-field !pl-10"
              placeholder={t("profile.fullNamePlaceholder")} value={form.full_name} onChange={set("full_name")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="profile-age" label={t("profile.age")} icon={CalendarDays}>
              <input id="profile-age" type="number" min="1" max="120" className="input-field !pl-10"
                placeholder={t("profile.age")} value={form.age} onChange={set("age")} />
            </Field>
            <Field id="profile-gender" label={t("profile.gender")}>
              <select id="profile-gender" className="input-field" value={form.gender} onChange={set("gender")}>
                <option value="male">{t("common.gender.male")}</option>
                <option value="female">{t("common.gender.female")}</option>
                <option value="other">{t("common.gender.other")}</option>
              </select>
            </Field>
          </div>
          <Field id="profile-phone" label={<>{t("profile.phone")} <span className="text-dim font-normal">{t("common.optional")}</span></>} icon={Phone}>
            <input id="profile-phone" type="tel" className="input-field !pl-10"
              placeholder={t("register.phonePlaceholder")} value={form.phone} onChange={set("phone")} />
          </Field>
          <div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t("profile.save")}
            </button>
          </div>
        </form>

        <div className="grid gap-4">
          <section className="card">
            <div className="card-head">
              <div className="card-icon"><Shield className="w-5 h-5" /></div>
              <div><h2>{t("profile.security")}</h2><small>{t("profile.password")}</small></div>
            </div>
            <p className="text-muted text-[14.5px]">{t("profile.passwordHint")}</p>
          </section>

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
        </div>
      </div>
    </div>
  );
}
