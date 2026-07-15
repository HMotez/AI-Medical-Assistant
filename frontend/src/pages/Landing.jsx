import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Heart, Brain, Wind, Microscope, Stethoscope, Shield,
  Zap, FileText, Search, Activity, Phone, ArrowRight,
  Star, CheckCircle, TrendingUp, Clock, Users, Award,
  ChevronDown, Mail, MapPin
} from "lucide-react";
import { PHOTOS } from "../constants/photos";

const DEPARTMENTS = [
  { Icon: Heart,       label: "Cardiology",      desc: "Heart & circulatory",   color: "from-red-400 to-rose-600" },
  { Icon: Brain,       label: "Neurology",        desc: "Nervous system",        color: "from-purple-400 to-violet-600" },
  { Icon: Wind,        label: "Pulmonology",      desc: "Respiratory tract",     color: "from-blue-400 to-cyan-600" },
  { Icon: Microscope,  label: "Dermatology",      desc: "Skin & tissue",         color: "from-pink-400 to-fuchsia-600" },
  { Icon: Stethoscope, label: "General Medicine", desc: "Primary care",          color: "from-teal-400 to-emerald-600" },
  { Icon: Shield,      label: "Infectiology",     desc: "Infectious diseases",   color: "from-green-400 to-lime-600" },
];

const FEATURES = [
  { Icon: Zap,        title: "3-Second Analysis",  desc: "Instant AI diagnosis with top 5 probable diseases ranked by confidence score.",        color: "from-amber-400 to-orange-500" },
  { Icon: Search,     title: "Explainable AI",      desc: "Each prediction shows exactly which symptoms drove the decision — full transparency.",  color: "from-teal-400 to-cyan-500" },
  { Icon: FileText,   title: "PDF Medical Report",  desc: "Professional clinical report generated instantly, ready to share with your doctor.",    color: "from-blue-400 to-indigo-500" },
  { Icon: TrendingUp, title: "Progress Tracking",   desc: "Compare analyses over time to detect health trends and monitor your improvements.",     color: "from-purple-400 to-violet-500" },
  { Icon: Shield,     title: "Data Privacy",        desc: "Your health data is encrypted end-to-end and never sold or shared with third parties.", color: "from-green-400 to-emerald-500" },
  { Icon: Users,      title: "Doctor Review",       desc: "Certified doctors can review your AI analysis and add professional medical comments.",  color: "from-rose-400 to-pink-500" },
];

const STATS = [
  { value: "41",   label: "Diseases Covered",  Icon: Activity, color: "from-teal-400 to-emerald-500" },
  { value: "132",  label: "Symptoms Tracked",  Icon: Search,   color: "from-blue-400 to-cyan-500" },
  { value: "100%", label: "Model Accuracy",    Icon: Award,    color: "from-purple-400 to-violet-500" },
  { value: "<3s",  label: "Response Time",     Icon: Clock,    color: "from-green-400 to-lime-500" },
];

const STEPS = [
  { n: "01", title: "Create your account",  desc: "Free sign-up in 30 seconds.",               grad: "from-teal-400 to-emerald-500" },
  { n: "02", title: "Select symptoms",      desc: "Choose from 132 medical symptoms.",          grad: "from-blue-400 to-cyan-500" },
  { n: "03", title: "Get AI analysis",      desc: "Top 5 predictions + specialist + urgency.", grad: "from-purple-400 to-violet-500" },
  { n: "04", title: "Download PDF report",  desc: "Professional report ready for your doctor.", grad: "from-green-400 to-lime-500" },
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
              <Star className="w-3 h-3 fill-teal-500 text-teal-500" /> AI-Powered Medical Platform
            </span>
            <h1 className="font-black leading-[1.08] mb-5 text-gray-900" style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)" }}>
              Your Health,<br />Our Priority
            </h1>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-md">
              Compassionate AI-driven care for you and your family. Describe your symptoms and get an instant medical analysis.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Link to={user ? "/patient/analyze" : "/register"} className="btn-primary text-base font-black px-8 py-4 gap-2 shadow-teal">
                Check My Symptoms <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="bg-white/80 hover:bg-white border-2 border-teal-400/40 text-teal-700 font-black text-base px-8 py-4 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 backdrop-blur-sm">
                <Stethoscope className="w-5 h-5" /> Doctor Portal
              </Link>
            </div>
            <div className="flex items-center gap-5 flex-wrap">
              {["Free forever", "100% private", "No ads"].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                  <CheckCircle className="w-4 h-4 text-teal-500" /> {t}
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
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Specialty
                  </label>
                  <div className="relative">
                    <select className="input-field pr-8 font-semibold appearance-none bg-gray-50">
                      <option>All Specialties</option>
                      <option>Cardiology</option><option>Neurology</option><option>Pulmonology</option>
                      <option>Dermatology</option><option>General Medicine</option><option>Infectiology</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Symptom Type
                  </label>
                  <div className="relative">
                    <select className="input-field pr-8 font-semibold appearance-none bg-gray-50">
                      <option>Select type</option>
                      <option>Pain & Discomfort</option><option>Fever & Chills</option>
                      <option>Respiratory</option><option>Skin & Rash</option><option>Digestive</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Urgency Feeling
                  </label>
                  <div className="relative">
                    <select className="input-field pr-8 font-semibold appearance-none bg-gray-50">
                      <option>Not sure</option>
                      <option>Mild — can wait</option><option>Moderate — getting worse</option>
                      <option>Emergency — need help now</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <Link to={user ? "/patient/analyze" : "/register"} className="btn-primary w-full justify-center text-base font-black py-3.5 gap-2 rounded-2xl shadow-teal">
                  <Activity className="w-5 h-5" /> Analyze Now
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
            <SectionTag>Platform Stats</SectionTag>
            <h2 className="text-3xl font-black text-white">Trusted by Patients Worldwide</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map(({ value, label, Icon, color }, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col items-center gap-3 hover:-translate-y-1 transition-all hover:bg-white/15">
                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-4xl font-black text-white">{value}</div>
                <div className="text-xs font-bold text-white/60 text-center uppercase tracking-wide">{label}</div>
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
  return (
    <PhotoPage photo={PHOTOS.symptomChecker} overlay="linear-gradient(135deg, rgba(6,14,28,0.87) 0%, rgba(6,26,36,0.82) 100%)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <SectionTag>Features</SectionTag>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-3 mb-4">AI-Powered Services</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">Everything you need for smart symptom analysis — fast, private, explainable.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {FEATURES.map(({ Icon, title, desc, color }, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-7 group hover:-translate-y-2 hover:bg-white/15 hover:border-white/30 transition-all duration-300">
              <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-black text-white mb-2">{title}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-10 mb-10">
          <h2 className="text-2xl font-black text-white text-center mb-2">How It Works</h2>
          <p className="text-white/50 text-center mb-10">From symptoms to report in 4 simple steps</p>
          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-9 left-[12.5%] right-[12.5%] h-0.5"
              style={{ background: "linear-gradient(to right, #14b8a6, #3b82f6, #8b5cf6, #22c55e)" }} />
            {STEPS.map((s, i) => (
              <div key={i} className="text-center group">
                <div className={`w-14 h-14 bg-gradient-to-br ${s.grad} rounded-2xl flex items-center justify-center font-black text-lg mx-auto mb-5 shadow-lg text-white group-hover:scale-110 transition-transform`}>
                  {s.n}
                </div>
                <h3 className="font-black text-white mb-2 text-sm">{s.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link to={user ? "/patient/analyze" : "/register"} className="btn-primary text-base font-black px-10 py-4 gap-2 shadow-teal">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </PhotoPage>
  );
}

/* ── SPECIALTIES VIEW ── */
function DepartmentsView({ user }) {
  const URGENCY = [
    { label: "Emergency", count: 4,  color: "from-red-400 to-red-600",       desc: "Requires immediate medical attention" },
    { label: "High",      count: 16, color: "from-orange-400 to-orange-600", desc: "See a doctor within 24 hours" },
    { label: "Moderate",  count: 15, color: "from-amber-400 to-amber-600",   desc: "Schedule within a week" },
    { label: "Low",       count: 6,  color: "from-green-400 to-green-600",   desc: "Monitor symptoms, stay hydrated" },
  ];

  return (
    <PhotoPage photo={PHOTOS.results} overlay="linear-gradient(135deg, rgba(6,14,28,0.87) 0%, rgba(10,20,50,0.82) 100%)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <SectionTag>Specialties</SectionTag>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-3 mb-4">Medical Domains Covered</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">41 diseases across 6 major medical specialties, powered by a 4,920-case dataset.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-14">
          {DEPARTMENTS.map(({ Icon, label, desc, color }, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 flex flex-col items-center text-center gap-3 group hover:-translate-y-3 hover:bg-white/18 hover:border-white/30 transition-all duration-300">
              <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div className="font-black text-sm text-white">{label}</div>
              <div className="text-xs text-white/50 leading-snug">{desc}</div>
            </div>
          ))}
        </div>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white mb-2">Urgency Classification</h2>
          <p className="text-white/50">Every diagnosis is automatically classified by urgency level</p>
        </div>
        <div className="grid md:grid-cols-4 gap-5 mb-14">
          {URGENCY.map(({ label, count, color, desc }) => (
            <div key={label} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 text-center hover:-translate-y-1 hover:bg-white/15 transition-all">
              <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <span className="text-white font-black text-xl">{count}</span>
              </div>
              <div className="font-black text-white mb-2">{label}</div>
              <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to={user ? "/patient/analyze" : "/register"} className="btn-primary text-base font-black px-10 py-4 gap-2 shadow-teal">
            Check My Symptoms <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </PhotoPage>
  );
}

/* ── CONTACT VIEW ── */
function ContactView() {
  return (
    <PhotoPage photo={PHOTOS.history} overlay="linear-gradient(135deg, rgba(6,14,28,0.88) 0%, rgba(20,10,30,0.83) 100%)">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <SectionTag color="text-amber-400">Contact</SectionTag>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-3 mb-4">Get In Touch</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">Have questions? For medical emergencies, always call emergency services immediately.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            {[
              { Icon: Mail,   title: "Email Support", value: "support@medai.com",    sub: "We respond within 24 hours",        color: "from-teal-400 to-cyan-500" },
              { Icon: MapPin, title: "Platform",      value: "AI Medical Assistant", sub: "Web platform — no app needed",      color: "from-blue-400 to-indigo-500" },
              { Icon: Shield, title: "Privacy",       value: "100% Encrypted",       sub: "Your data is never sold or shared", color: "from-green-400 to-emerald-500" },
            ].map(({ Icon, title, value, sub, color }) => (
              <div key={title} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/15 transition-all">
                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-md shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs font-black text-white/40 uppercase tracking-wider">{title}</div>
                  <div className="font-black text-white">{value}</div>
                  <div className="text-xs text-white/40 mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/10 backdrop-blur-md border-2 border-red-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Phone className="w-5 h-5 text-red-400" />
              <h3 className="font-black text-white text-lg">Emergency Numbers</h3>
            </div>
            <div className="space-y-3">
              {[["SAMU (Medical Emergency)", "15"], ["Fire Department", "18"], ["Police", "17"], ["Europe Emergency", "112"]].map(([l, n]) => (
                <div key={l} className="flex items-center justify-between bg-white/8 border border-white/15 rounded-xl px-4 py-3">
                  <span className="text-sm font-semibold text-white/80">{l}</span>
                  <span className="text-red-400 font-black text-2xl">{n}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/40 mt-4 text-center">In a medical emergency, do not use this platform. Call 112 immediately.</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-amber-400/30 rounded-2xl p-7">
          <h3 className="font-black text-white text-lg mb-5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" /> Policies & Disclaimer
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-5">
            {[
              { title: "Data Privacy",      desc: "Your health data is encrypted end-to-end and never sold or shared with third parties." },
              { title: "Not a Replacement", desc: "AI analysis is informational only. Always consult a licensed healthcare professional." },
              { title: "Accuracy Notice",   desc: "Predictions are based on a real 4920-case dataset covering 41 diseases and 132 symptoms." },
              { title: "Report Usage",      desc: "Generated PDF reports are for reference only and carry no medical-legal weight." },
            ].map(({ title, desc }) => (
              <div key={title} className="flex gap-3">
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-sm text-white">{title}</div>
                  <div className="text-xs text-white/50 mt-0.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-4 text-center">
            <p className="text-sm text-white/70 leading-relaxed">
              <strong className="text-red-400">Medical Disclaimer:</strong> This platform is for informational purposes only. In case of emergency, call <strong className="text-white">112</strong>.
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
