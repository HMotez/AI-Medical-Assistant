import { useSearchParams, Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import ConstellationStage from "../components/three/ConstellationStage";
import PageHead from "../components/ui/PageHead";
import { PHOTOS } from "../constants/photos";
import { URGENCY_TONE } from "../constants/urgency";
import {
  Heart, Brain, Wind, Microscope, Stethoscope, Shield,
  Zap, FileText, Search, Activity, Phone, ArrowRight,
  CheckCircle, TrendingUp, Languages, Users, Award, Mail, MapPin, AlertTriangle, AlertCircle
} from "lucide-react";
import StatTile from "../components/ui/StatTile";
import { PhotoCard } from "../components/ui/PhotoPanel";
import { useMedicalLabels } from "../i18n/medical";

const DEPARTMENTS = [
  { Icon: Heart,       key: "cardiology" },
  { Icon: Brain,       key: "neurology" },
  { Icon: Wind,        key: "pulmonology" },
  { Icon: Microscope,  key: "dermatology" },
  { Icon: Stethoscope, key: "general" },
  { Icon: Shield,      key: "infectiology" },
];

const FEATURES = [
  { Icon: Zap,        key: "speed" },
  { Icon: Search,     key: "xai" },
  { Icon: FileText,   key: "pdf" },
  { Icon: TrendingUp, key: "progress" },
  { Icon: Shield,     key: "privacy" },
  { Icon: Users,      key: "review" },
];

const STATS = [
  { value: 41,  key: "diseases",  Icon: Activity },
  { value: 131, key: "symptoms",  Icon: Search },
  { value: 95,  key: "accuracy",  Icon: Award, unit: "%", meter: 0.95 },
  { value: 2,   key: "languages", Icon: Languages },
];

const STEPS = ["account", "symptoms", "analysis", "report"];

// Number of diseases per urgency level (matches URGENCY_RULES in the backend)
const URGENCY = [
  { key: "emergency", count: 2,  Icon: Zap,           cls: "urgency-emergency" },
  { key: "high",      count: 9,  Icon: AlertTriangle, cls: "urgency-high" },
  { key: "moderate",  count: 4,  Icon: AlertCircle,   cls: "urgency-moderate" },
  { key: "low",       count: 26, Icon: CheckCircle,   cls: "urgency-low" },
];

function CardIcon({ Icon }) {
  return <div className="card-icon"><Icon className="w-5 h-5" /></div>;
}

function Section({ eyebrow, title, text, photo, children }) {
  return (
    <section className="mt-10 first:mt-0">
      <PageHead eyebrow={eyebrow} title={title} subtitle={text} photo={photo} plain={!photo} />
      {photo && <div className="h-4" />}
      {children}
    </section>
  );
}

function Hero({ user }) {
  const { t } = useTranslation();
  return (
    <ConstellationStage className="min-h-[420px]" photo={PHOTOS.hero}>
      <span className="pill pill-glass w-fit mb-4">
        <Activity className="w-3.5 h-3.5" /> {t("landing.hero.badge")}
      </span>
      <h1 className="text-[clamp(2.2rem,4.6vw,3.6rem)] font-bold leading-[1.02]">
        {t("landing.hero.title1")}<br />{t("landing.hero.title2")}
      </h1>
      <p className="text-white/85 text-[16.5px] leading-relaxed mt-4 max-w-md">{t("landing.hero.text")}</p>
      <div className="flex flex-wrap gap-2.5 mt-6">
        <Link to={user ? "/patient/analyze" : "/register"} className="btn-primary btn-light">
          {t("landing.hero.cta")} <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/login" className="btn-ghost !bg-white/15 !text-white backdrop-blur">
          <Stethoscope className="w-4 h-4" /> {t("landing.hero.doctorPortal")}
        </Link>
      </div>
      <div className="flex flex-wrap gap-2 mt-5">
        {["free", "private", "noAds"].map(k => (
          <span key={k} className="pill pill-glass !py-1.5 !text-[13px]"><CheckCircle className="w-3.5 h-3.5" /> {t(`landing.hero.badges.${k}`)}</span>
        ))}
      </div>
    </ConstellationStage>
  );
}

function Stats() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
      {STATS.map(({ value, key, Icon, unit, meter }) => (
        <StatTile key={key} label={t(`landing.stats.${key}`)} value={value} unit={unit} icon={Icon} meter={meter}
          caption={t(`landing.stats.captions.${key}`)} />
      ))}
    </div>
  );
}

const EXAMPLE_SYMPTOMS = ["high_fever", "cough", "fatigue", "headache"];

function HowItWorks({ user }) {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  return (
    <Section eyebrow={t("landing.services.tag")} title={t("landing.services.howTitle")} text={t("landing.services.howText")}>
      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-3.5">
        <PhotoCard photo={PHOTOS.symptomChecker} rings className="min-h-[340px] p-7">
          <span className="pill pill-glass w-fit !py-1 !text-[12.5px]">{t("landing.example")}</span>
          <div className="mt-auto">
            <div className="flex flex-wrap gap-2 max-w-[22rem]">
              {EXAMPLE_SYMPTOMS.map((code, i) => (
                <span key={code} className="pill pill-glass !text-[14px] float-chip" style={{ animationDelay: `${i * 0.6}s` }}>
                  <CheckCircle className="w-3.5 h-3.5" /> {labels.symptom(code)}
                </span>
              ))}
            </div>
            <h3 className="text-[24px] font-bold leading-tight mt-4 max-w-xs">{t("landing.stats.captions.symptoms")}</h3>
          </div>
        </PhotoCard>

        <ol className="card grid gap-1 !p-3">
          {STEPS.map((key, i) => (
            <li key={key} className="flex gap-4 items-start rounded-[20px] p-3.5 hover:bg-panel2 transition-colors">
              <span className="num-outline text-[44px] w-14 shrink-0">0{i + 1}</span>
              <div className="min-w-0 pt-1">
                <h3 className="text-[17.5px] font-bold">{t(`landing.services.steps.${key}.title`)}</h3>
                <p className="text-muted text-[14.5px] mt-0.5">{t(`landing.services.steps.${key}.desc`)}</p>
              </div>
            </li>
          ))}
          <li className="p-3.5 pt-2">
            <Link to={user ? "/patient/analyze" : "/register"} className="btn-primary">
              {t("landing.services.cta")} <ArrowRight className="w-4 h-4" />
            </Link>
          </li>
        </ol>
      </div>
    </Section>
  );
}

function Features({ photo }) {
  const { t } = useTranslation();
  const small = FEATURES.filter(f => f.key !== "xai" && f.key !== "review");
  return (
    <Section eyebrow={t("landing.services.tag")} title={t("landing.services.title")} text={t("landing.services.text")} photo={photo}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <PhotoCard photo={PHOTOS.results} rings className="sm:col-span-2 lg:col-span-1 lg:row-span-2 min-h-[300px] p-7">
          <div className="w-12 h-12 rounded-2xl grid place-items-center bg-white/15 backdrop-blur"><Search className="w-6 h-6" /></div>
          <div className="mt-auto">
            <h3 className="text-[24px] font-bold leading-tight">{t("landing.services.features.xai.title")}</h3>
            <p className="text-white/85 text-[15px] leading-relaxed mt-2 max-w-sm">{t("landing.services.features.xai.desc")}</p>
          </div>
        </PhotoCard>
        {small.map(({ Icon, key }) => (
          <div key={key} className="card">
            <div className="card-head !mb-3">
              <CardIcon Icon={Icon} />
              <h3>{t(`landing.services.features.${key}.title`)}</h3>
            </div>
            <p className="text-muted text-[15px] leading-relaxed">{t(`landing.services.features.${key}.desc`)}</p>
          </div>
        ))}
        <PhotoCard photo={PHOTOS.doctorDash} className="sm:col-span-2 lg:col-span-3 min-h-[180px] p-7" position="center 25%">
          <div className="flex flex-wrap items-end gap-5 mt-auto">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-white/15 backdrop-blur"><Users className="w-6 h-6" /></div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[24px] font-bold leading-tight">{t("landing.services.features.review.title")}</h3>
              <p className="text-white/85 text-[15px] leading-relaxed mt-1 max-w-lg">{t("landing.services.features.review.desc")}</p>
            </div>
            <Link to="/login" className="btn-primary btn-light"><Stethoscope className="w-4 h-4" /> {t("landing.hero.doctorPortal")}</Link>
          </div>
        </PhotoCard>
      </div>
    </Section>
  );
}

function Specialties({ user }) {
  const { t } = useTranslation();
  return (
    <>
      <Section eyebrow={t("landing.specialties.tag")} title={t("landing.specialties.title")} text={t("landing.specialties.text")} photo={PHOTOS.doctorDash}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {DEPARTMENTS.map(({ Icon, key }) => (
            <div key={key} className="card !p-5 text-center">
              <div className="card-icon mx-auto"><Icon className="w-5 h-5" /></div>
              <div className="font-display font-bold text-[16px] mt-3">{t(`landing.departments.${key}.label`)}</div>
              <div className="text-[13.5px] text-muted mt-0.5">{t(`landing.departments.${key}.desc`)}</div>
            </div>
          ))}
        </div>
      </Section>
      <Section title={t("landing.specialties.urgencyTitle")} text={t("landing.specialties.urgencyText")}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {URGENCY.map(({ key, count, Icon, cls }) => (
            <StatTile key={key} label={t(`common.urgency.${key}`)} value={count} unit={t("landing.specialties.unit", { count })}
              icon={Icon} tone={URGENCY_TONE[key]} caption={t(`landing.specialties.urgency.${key}`)} />
          ))}
        </div>
        <div className="mt-5">
          <Link to={user ? "/patient/analyze" : "/register"} className="btn-primary">
            {t("landing.specialties.cta")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Section>
    </>
  );
}

const CONTACT_CARDS = [
  { Icon: Mail,   key: "email" },
  { Icon: MapPin, key: "platform" },
  { Icon: Shield, key: "privacy" },
];
const EMERGENCY_NUMBERS = [["samu", "15"], ["fire", "18"], ["police", "17"], ["europe", "112"]];
const POLICIES = ["privacy", "notReplacement", "accuracy", "reports"];

function Contact() {
  const { t } = useTranslation();
  return (
    <Section eyebrow={t("landing.contact.tag")} title={t("landing.contact.title")} text={t("landing.contact.text")} photo={PHOTOS.login}>
      <div className="grid lg:grid-cols-2 gap-3.5">
        <div className="grid gap-3.5">
          {CONTACT_CARDS.map(({ Icon, key }) => (
            <div key={key} className="card flex items-center gap-4 !py-4">
              <CardIcon Icon={Icon} />
              <div className="min-w-0">
                <div className="text-[12.5px] uppercase tracking-[0.14em] text-dim">{t(`landing.contact.cards.${key}.title`)}</div>
                <div className="font-display font-bold">{t(`landing.contact.cards.${key}.value`)}</div>
                <div className="text-[14px] text-muted">{t(`landing.contact.cards.${key}.sub`)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-head">
            <div className="card-icon !text-bad !bg-bad/10"><Phone className="w-5 h-5" /></div>
            <h3>{t("landing.contact.emergencyTitle")}</h3>
          </div>
          <div className="grid gap-2">
            {EMERGENCY_NUMBERS.map(([key, n]) => (
              <div key={key} className="flex items-center justify-between rounded-2xl bg-panel2 px-4 py-3">
                <span className="text-[15px] font-medium">{t(`landing.contact.numbers.${key}`)}</span>
                <span className="font-data text-bad text-[21.5px] font-medium">{n}</span>
              </div>
            ))}
          </div>
          <p className="text-[13.5px] text-muted mt-3">{t("landing.contact.emergencyNote")}</p>
        </div>
      </div>

      <div className="card mt-3.5">
        <div className="card-head"><CardIcon Icon={Shield} /><h3>{t("landing.contact.policiesTitle")}</h3></div>
        <div className="grid md:grid-cols-2 gap-4">
          {POLICIES.map(key => (
            <div key={key} className="flex gap-3">
              <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-[15.5px]">{t(`landing.contact.policies.${key}.title`)}</div>
                <div className="text-[14px] text-muted leading-relaxed">{t(`landing.contact.policies.${key}.desc`)}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="alert-error mt-5 !items-start">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span><strong>{t("landing.contact.disclaimerLabel")}</strong>{" "}
            <Trans i18nKey="landing.contact.disclaimer" components={{ strong: <strong /> }} /></span>
        </p>
      </div>
    </Section>
  );
}

/* ══════ MAIN EXPORT ══════ */
export default function Landing() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");

  if (view === "services")    return <><Features photo={PHOTOS.adminDash} /><HowItWorks user={user} /></>;
  if (view === "departments") return <Specialties user={user} />;
  if (view === "contact")     return <Contact />;
  return (
    <>
      <Hero user={user} />
      <Stats />
      <HowItWorks user={user} />
      <Features />
    </>
  );
}
