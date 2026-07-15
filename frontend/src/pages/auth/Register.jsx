import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Stethoscope, User, Mail, Lock, Phone, CalendarDays,
  AlertCircle, Loader2, ArrowRight, CheckCircle, Shield,
  Zap, FileText, TrendingUp
} from "lucide-react";
import { PHOTOS } from "../../constants/photos";

const PERKS = [
  { Icon: Zap,       text: "Instant AI symptom analysis",      color: "text-amber-400" },
  { Icon: FileText,  text: "Professional PDF medical reports",  color: "text-blue-400" },
  { Icon: TrendingUp,text: "Track your health over time",       color: "text-green-400" },
  { Icon: Shield,    text: "100% private — zero data sharing",  color: "text-teal-400" },
];

export default function Register() {
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
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8)       { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await register({
        full_name: form.full_name, email: form.email, password: form.password,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender, phone: form.phone || undefined,
      });
      navigate("/patient");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left: dark photo panel ── */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${PHOTOS.register})` }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(150deg, rgba(4,20,35,0.95) 0%, rgba(6,40,55,0.90) 50%, rgba(8,60,70,0.85) 100%)" }} />

        {/* Top brand */}
        <div className="relative z-10 p-10">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-11 h-11 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-black text-lg tracking-wide leading-none">AI MEDICAL</div>
              <div className="text-teal-400 text-xs font-semibold uppercase tracking-widest">Assistant</div>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-10">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
            Free Forever
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Start analyzing<br />
            <span className="text-teal-400">your health today</span>
          </h2>
          <p className="text-white/55 text-base leading-relaxed mb-10">
            Join thousands of patients who trust AI Medical for fast, private, and accurate symptom analysis.
          </p>

          <div className="space-y-3">
            {PERKS.map(({ Icon, text, color }) => (
              <div key={text} className="flex items-center gap-3 bg-white/6 border border-white/10 rounded-xl px-4 py-3">
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-white/80 text-sm font-semibold">{text}</span>
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 ml-auto" />
              </div>
            ))}
          </div>

          <div className="mt-8 bg-gradient-to-r from-teal-500/20 to-cyan-500/10 border border-teal-400/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-teal-400" />
              <span className="text-teal-300 font-black text-sm">Medical Grade Privacy</span>
            </div>
            <p className="text-white/50 text-xs leading-relaxed">
              Your health data is encrypted end-to-end, never sold, never shared. You own your data.
            </p>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 px-10 py-4">
          <p className="text-white/25 text-xs text-center">No credit card · No hidden fees · Cancel anytime</p>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="w-full lg:w-[58%] bg-white flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-6">

          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-7 lg:hidden">
            <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-teal-600 text-lg">AI MEDICAL</span>
          </div>

          <div className="mb-7">
            <h2 className="text-3xl font-black text-gray-900 mb-1.5">Create your account</h2>
            <p className="text-gray-400">Free sign-up — takes 30 seconds</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl mb-5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" /> {error}
            </div>
          )}

          <form onSubmit={handle} className="space-y-4">

            {/* Full name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" required autoComplete="name"
                  className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all bg-gray-50 focus:bg-white"
                  placeholder="John Doe"
                  value={form.full_name} onChange={set("full_name")} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" required autoComplete="email"
                  className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all bg-gray-50 focus:bg-white"
                  placeholder="your@email.com"
                  value={form.email} onChange={set("email")} />
              </div>
            </div>

            {/* Password row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="password" required autoComplete="new-password"
                    className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all bg-gray-50 focus:bg-white"
                    placeholder="Min. 8 chars"
                    value={form.password} onChange={set("password")} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="password" required autoComplete="new-password"
                    className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all bg-gray-50 focus:bg-white"
                    placeholder="Repeat"
                    value={form.confirm} onChange={set("confirm")} />
                </div>
              </div>
            </div>

            {/* Age + gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Age</label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" min="1" max="120"
                    className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all bg-gray-50 focus:bg-white"
                    placeholder="25"
                    value={form.age} onChange={set("age")} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Gender</label>
                <select
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-sm font-semibold focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all bg-gray-50 focus:bg-white"
                  value={form.gender} onChange={set("gender")}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel"
                  className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all bg-gray-50 focus:bg-white"
                  placeholder="+1 555 000 0000"
                  value={form.phone} onChange={set("phone")} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-black text-base py-4 rounded-xl shadow-lg hover:shadow-teal-200 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-1">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</>
                : <>Create Account <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            By creating an account you agree to our{" "}
            <span className="text-teal-600 font-semibold cursor-pointer hover:underline">Terms of Service</span>
            {" "}and{" "}
            <span className="text-teal-600 font-semibold cursor-pointer hover:underline">Privacy Policy</span>
          </p>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-teal-600 font-black hover:text-teal-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
