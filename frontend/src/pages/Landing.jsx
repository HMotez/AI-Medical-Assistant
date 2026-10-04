import { useSearchParams, Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  Heart, Brain, Wind, Microscope, Stethoscope, Shield,
  Zap, FileText, Search, Activity, Phone, ArrowRight,
  Star, CheckCircle, TrendingUp, Clock, Users, Award,
  ChevronDown, Mail, MapPin
} from "lucide-react";
import { PHOTOS } from "../constants/photos";

const DEPARTMENTS = [
  { Icon: Heart,       key: "cardiology",   color: "from-red-400 to-rose-600" },
  { Icon: Brain,       key: "neurology",    color: "from-purple-400 to-violet-600" },
  { Icon: Wind,        key: "pulmonology",  color: "from-blue-400 to-cyan-600" },
  { Icon: Microscope,  key: "dermatology",  color: "from-pink-400 to-fuchsia-600" },
  { Icon: Stethoscope, key: "general",      color: "from-teal-400 to-emerald-600" },
  { Icon: Shield,      key: "infectiology", color: "from-green-400 to-lime-600" },
];

const FEATURES = [
  { Icon: Zap,        key: "speed",    color: "from-amber-400 to-orange-500" },
  { Icon: Search,     key: "xai",      color: "from-teal-400 to-cyan-500" },
  { Icon: FileText,   key: "pdf",      color: "from-blue-400 to-indigo-500" },
  { Icon: TrendingUp, key: "progress", color: "from-purple-400 to-violet-500" },
  { Icon: Shield,     key: "privacy",  color: "from-green-400 to-emerald-500" },
  { Icon: Users,      key: "review",   color: "from-rose-400 to-pink-500" },
];

const STATS = [
  { value: "41",  key: "diseases", Icon: Activity, color: "from-teal-400 to-emerald-500" },
  { value: "131", key: "symptoms", Icon: Search,   color: "from-blue-400 to-cyan-500" },
  { value: "95%", key: "accuracy", Icon: Award,    color: "from-purple-400 to-violet-500" },
  { value: "<3s", key: "response", Icon: Clock,    color: "from-green-400 to-lime-500" },
];

const STEPS = [
  { n: "01", key: "account",  grad: "from-teal-400 to-emerald-500" },
  { n: "02", key: "symptoms", grad: "from-blue-400 to-cyan-500" },
  { n: "03", key: "analysis", grad: "from-purple-400 to-violet-500" },
  { n: "04", key: "report",   grad: "from-green-400 to-lime-500" },
];

// Number of diseases per urgency level (matches URGENCY_RULES in the backend)
const URGENCY = [
  { key: "emergency", count: 2,  color: "from-red-400 to-red-600" },
  { key: "high",      count: 9,  color: "from-orange-400 to-orange-600" },
  { key: "moderate",  count: 4,  color: "from-amber-400 to-amber-600" },
  { key: "low",       count: 26, color: "from-green-400 to-green-600" },
];

/* Full-screen photo background wrapper — same concept as the hero */
function PhotoPage({ photo, overlay, children }) {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundImage: `url(${photo})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0" style={{ background: overlay || "linear-gradient(135deg, rgba(6,14,28,0.85) 0%, rgba(6,26,36,0.80) 100%)" }} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/* Section label */
function SectionTag({ children, color = "text-teal-400" }) {
  return (
    <span className={`inline-block text-xs font-black uppercase tracking-widest mb-3 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20 ${color}`}>
      {children}
    </span>
  );
}

/* ── HOME VIEW ── */
function HomeView({ user }) {
  const { t } = useTranslation();
  return (
    <div>
      {/* Hero */}
      <section
        className="relative min-h-screen flex flex-col justify-between overflow-hidden"
        style={{ backgroundImage: `url(${PHOTOS.hero})`, backgroundSize: "cover", backgroundPosition: "center right" }}
      >
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to right, rgba(224,246,251,0.97) 0%, rgba(224,246,251,0.92) 35%, rgba(224,246,251,0.6) 55%, rgba(224,246,251,0.1) 75%, transparent 100%)",
        }} />

        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 flex-1 flex flex-col justify-center pt-16 pb-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 bg-teal-500/15 text-teal-700 border border-teal-400/30 text-xs font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
              <Star className="w-3 h-3 fill-teal-500 text-teal-500" /> {t("landing.hero.badge")}
            </span>
            <h1 className="font-black leading-[1.08] mb-5 text-gray-900" style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)" }}>
              {t("landing.hero.title1")}<br />{t("landing.hero.title2")}
            </h1>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-md">
              {t("landing.hero.text")}
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Link to={user ? "/patient/analyze" : "/register"} className="btn-primary text-base font-black px-8 py-4 gap-2 shadow-teal">
                {t("landing.hero.cta")} <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="bg-white/80 hover:bg-white border-2 border-teal-400/40 text-teal-700 font-black text-base px-8 py-4 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 backdrop-blur-sm">
                <Stethoscope className="w-5 h-5" /> {t("landing.hero.doctorPortal")}
              </Link>
            </div>
            <div className="flex items-center gap-5 flex-wrap">
              {["free", "private", "noAds"].map(k => (
                <span key={k} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                  <CheckCircle className="w-4 h-4 text-teal-500" /> {t(`landing.hero.badges.${k}`)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick analysis bar */}
        <div className="relative px-4 sm:px-8 lg:px-12 pb-10">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/85 backdrop-blur-md rounded-3xl shadow-card-hover border border-white p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label htmlFor="quick-specialty" className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> {t("landing.quick.specialty")}
                  </label>
                  <div className="relative">
                    <select id="quick-specialty" className="input-field pr-8 font-semibold appearance-none bg-gray-50">
                      <option>{t("landing.quick.allSpecialties")}</option>
                      {DEPARTMENTS.map(d => <option key={d.key}>{t(`landing.departments.${d.key}.label`)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label htmlFor="quick-type" className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <Activity className="w-3 h-3" /> {t("landing.quick.symptomType")}
                  </label>
                  <div className="relative">
                    <select id="quick-type" className="input-field pr-8 font-semibold appearance-none bg-gray-50">
                      <option>{t("landing.quick.selectType")}</option>
                      {["pain", "fever", "respiratory", "skin", "digestive"].map(k =>
                        <option key={k}>{t(`landing.quick.types.${k}`)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label htmlFor="quick-urgency" className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {t("landing.quick.urgencyFeeling")}
                  </label>
                  <div className="relative">
                    <select id="quick-urgency" className="input-field pr-8 font-semibold appearance-none bg-gray-50">
                      {["notSure", "mild", "moderate", "emergency"].map(k =>
                        <option key={k}>{t(`landing.quick.urgency.${k}`)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <Link to={user ? "/patient/analyze" : "/register"} className="btn-primary w-full justify-center text-base font-black py-3.5 gap-2 rounded-2xl shadow-teal">
                  <Activity className="w-5 h-5" /> {t("landing.quick.analyze")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats on doctor photo */}
      <PhotoPage photo={PHOTOS.doctorDash} overlay="linear-gradient(135deg, rgba(6,14,28,0.88) 0%, rgba(6,30,50,0.82) 100%)">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <SectionTag>{t("landing.stats.tag")}</SectionTag>
            <h2 className="text-3xl font-black text-white">{t("landing.stats.title")}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map(({ value, key, Icon, color }) => (
              <div key={key} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col items-center gap-3 hover:-translate-y-1 transition-all hover:bg-white/15">
                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-4xl font-black text-white">{value}</div>
                <div className="text-xs font-bold text-white/60 text-center uppercase tracking-wide">{t(`landing.stats.${key}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </PhotoPage>
    </div>
  );
}

/* ── SERVICES VIEW ── */
function ServicesView({ user }) {
  const { t } = useTranslation();
  return (
    <PhotoPage photo={PHOTOS.symptomChecker} overlay="linear-gradient(135deg, rgba(6,14,28,0.87) 0%, rgba(6,26,36,0.82) 100%)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <SectionTag>{t("landing.services.tag")}</SectionTag>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-3 mb-4">{t("landing.services.title")}</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">{t("landing.services.text")}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {FEATURES.map(({ Icon, key, color }) => (
            <div key={key} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-7 group hover:-translate-y-2 hover:bg-white/15 hover:border-white/30 transition-all duration-300">
              <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-black text-white mb-2">{t(`landing.services.features.${key}.title`)}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{t(`landing.services.features.${key}.desc`)}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-10 mb-10">
          <h2 className="text-2xl font-black text-white text-center mb-2">{t("landing.services.howTitle")}</h2>
          <p className="text-white/50 text-center mb-10">{t("landing.services.howText")}</p>
          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-9 left-[12.5%] right-[12.5%] h-0.5"
              style={{ background: "linear-gradient(to right, #14b8a6, #3b82f6, #8b5cf6, #22c55e)" }} />
            {STEPS.map(s => (
              <div key={s.key} className="text-center group">
                <div className={`w-14 h-14 bg-gradient-to-br ${s.grad} rounded-2xl flex items-center justify-center font-black text-lg mx-auto mb-5 shadow-lg text-white group-hover:scale-110 transition-transform`}>
                  {s.n}
                </div>
                <h3 className="font-black text-white mb-2 text-sm">{t(`landing.services.steps.${s.key}.title`)}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{t(`landing.services.steps.${s.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link to={user ? "/patient/analyze" : "/register"} className="btn-primary text-base font-black px-10 py-4 gap-2 shadow-teal">
            {t("landing.services.cta")} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </PhotoPage>
  );
}

/* ── SPECIALTIES VIEW ── */
function DepartmentsView({ user }) {
  const { t } = useTranslation();
  return (
    <PhotoPage photo={PHOTOS.results} overlay="linear-gradient(135deg, rgba(6,14,28,0.87) 0%, rgba(10,20,50,0.82) 100%)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <SectionTag>{t("landing.specialties.tag")}</SectionTag>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-3 mb-4">{t("landing.specialties.title")}</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">{t("landing.specialties.text")}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-14">
          {DEPARTMENTS.map(({ Icon, key, color }) => (
            <div key={key} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 flex flex-col items-center text-center gap-3 group hover:-translate-y-3 hover:bg-white/18 hover:border-white/30 transition-all duration-300">
              <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div className="font-black text-sm text-white">{t(`landing.departments.${key}.label`)}</div>
              <div className="text-xs text-white/50 leading-snug">{t(`landing.departments.${key}.desc`)}</div>
            </div>
          ))}
        </div>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white mb-2">{t("landing.specialties.urgencyTitle")}</h2>
          <p className="text-white/50">{t("landing.specialties.urgencyText")}</p>
        </div>
        <div className="grid md:grid-cols-4 gap-5 mb-14">
          {URGENCY.map(({ key, count, color }) => (
            <div key={key} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 text-center hover:-translate-y-1 hover:bg-white/15 transition-all">
              <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <span className="text-white font-black text-xl">{count}</span>
              </div>
              <div className="font-black text-white mb-2">{t(`common.urgency.${key}`)}</div>
              <p className="text-xs text-white/50 leading-relaxed">{t(`landing.specialties.urgency.${key}`)}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to={user ? "/patient/analyze" : "/register"} className="btn-primary text-base font-black px-10 py-4 gap-2 shadow-teal">
            {t("landing.specialties.cta")} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </PhotoPage>
  );
}

/* ── CONTACT VIEW ── */
const CONTACT_CARDS = [
  { Icon: Mail,   key: "email",    color: "from-teal-400 to-cyan-500" },
  { Icon: MapPin, key: "platform", color: "from-blue-400 to-indigo-500" },
  { Icon: Shield, key: "privacy",  color: "from-green-400 to-emerald-500" },
];
const EMERGENCY_NUMBERS = [["samu", "15"], ["fire", "18"], ["police", "17"], ["europe", "112"]];
const POLICIES = ["privacy", "notReplacement", "accuracy", "reports"];

function ContactView() {
  const { t } = useTranslation();
  return (
    <PhotoPage photo={PHOTOS.history} overlay="linear-gradient(135deg, rgba(6,14,28,0.88) 0%, rgba(20,10,30,0.83) 100%)">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <SectionTag color="text-amber-400">{t("landing.contact.tag")}</SectionTag>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-3 mb-4">{t("landing.contact.title")}</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">{t("landing.contact.text")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            {CONTACT_CARDS.map(({ Icon, key, color }) => (
              <div key={key} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/15 transition-all">
                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-md shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs font-black text-white/40 uppercase tracking-wider">{t(`landing.contact.cards.${key}.title`)}</div>
                  <div className="font-black text-white">{t(`landing.contact.cards.${key}.value`)}</div>
                  <div className="text-xs text-white/40 mt-0.5">{t(`landing.contact.cards.${key}.sub`)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/10 backdrop-blur-md border-2 border-red-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Phone className="w-5 h-5 text-red-400" />
              <h3 className="font-black text-white text-lg">{t("landing.contact.emergencyTitle")}</h3>
            </div>
            <div className="space-y-3">
              {EMERGENCY_NUMBERS.map(([key, n]) => (
                <div key={key} className="flex items-center justify-between bg-white/8 border border-white/15 rounded-xl px-4 py-3">
                  <span className="text-sm font-semibold text-white/80">{t(`landing.contact.numbers.${key}`)}</span>
                  <span className="text-red-400 font-black text-2xl">{n}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/40 mt-4 text-center">{t("landing.contact.emergencyNote")}</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-amber-400/30 rounded-2xl p-7">
          <h3 className="font-black text-white text-lg mb-5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" /> {t("landing.contact.policiesTitle")}
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-5">
            {POLICIES.map(key => (
              <div key={key} className="flex gap-3">
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-sm text-white">{t(`landing.contact.policies.${key}.title`)}</div>
                  <div className="text-xs text-white/50 mt-0.5 leading-relaxed">{t(`landing.contact.policies.${key}.desc`)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-4 text-center">
            <p className="text-sm text-white/70 leading-relaxed">
              <strong className="text-red-400">{t("landing.contact.disclaimerLabel")}</strong>{" "}
              <Trans i18nKey="landing.contact.disclaimer" components={{ strong: <strong className="text-white" /> }} />
            </p>
          </div>
        </div>
      </div>
    </PhotoPage>
  );
}

/* ══════ MAIN EXPORT ══════ */
export default function Landing() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");

  if (view === "services")    return <ServicesView user={user} />;
  if (view === "departments") return <DepartmentsView user={user} />;
  if (view === "contact")     return <ContactView />;
  return <HomeView user={user} />;
}
