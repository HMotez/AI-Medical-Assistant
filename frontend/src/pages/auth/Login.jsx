import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Stethoscope, Mail, Lock, AlertCircle, Loader2,
  ArrowRight, Shield, Activity, Users, Award
} from "lucide-react";
import { PHOTOS } from "../../constants/photos";

const STATS = [
  { Icon: Users,    value: "10k+",  label: "Patients" },
  { Icon: Activity, value: "41",    label: "Diseases" },
  { Icon: Award,    value: "100%",  label: "Accuracy" },
  { Icon: Shield,   value: "100%",  label: "Private" },
];

export default function Login() {
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
      const path = user.role === "admin" ? "/admin" : user.role === "doctor" ? "/doctor" : "/patient";
      navigate(path);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left: full photo panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${PHOTOS.login})` }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(4,30,40,0.93) 0%, rgba(10,40,55,0.88) 50%, rgba(6,60,70,0.82) 100%)" }} />

        {/* Top brand */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-black text-lg tracking-wide leading-none">AI MEDICAL</div>
              <div className="text-teal-400 text-xs font-semibold uppercase tracking-widest">Assistant</div>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-10">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
              <Shield className="w-3 h-3" /> Secure Medical Platform
            </div>
            <h1 className="text-5xl font-black text-white leading-tight mb-5">
              Your Health,<br />
              <span className="text-teal-400">Analyzed by AI</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-sm">
              Get instant AI-powered symptom analysis, specialist recommendations, and downloadable medical reports.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-3 mb-10">
            {STATS.map(({ Icon, value, label }) => (
              <div key={label} className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-4 text-center">
                <Icon className="w-5 h-5 text-teal-400 mx-auto mb-2" />
                <div className="text-white font-black text-xl">{value}</div>
                <div className="text-white/40 text-xs font-semibold mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-5">
            <p className="text-white/70 text-sm italic leading-relaxed mb-3">
              "AI Medical helped me identify my condition before my appointment. The report I brought to my doctor was incredibly detailed."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-black text-sm">
                S
              </div>
              <div>
                <div className="text-white font-bold text-sm">Sarah M.</div>
                <div className="text-white/40 text-xs">Verified Patient</div>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative z-10 border-t border-white/10 px-10 py-4">
          <p className="text-white/30 text-xs text-center">
            Protected by 256-bit encryption · HIPAA compliant · No data sharing
          </p>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="w-full lg:w-[48%] bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-teal-600 text-lg">AI MEDICAL</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-400 text-base">Sign in to access your medical portal</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl mb-6">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" /> {error}
            </div>
          )}

          <form onSubmit={handle} className="space-y-5">

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <input type="email" required autoComplete="email"
                  className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 text-base placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all bg-gray-50 focus:bg-white"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">Password</label>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <input type="password" required autoComplete="current-password"
                  className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 text-base placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-black text-base py-4 rounded-xl shadow-lg hover:shadow-teal-200 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
                : <>Sign In <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 bg-teal-50 border border-teal-100 rounded-xl p-4">
            <p className="text-xs font-black text-teal-700 uppercase tracking-wider mb-2">Demo accounts</p>
            <div className="space-y-1 text-xs text-teal-600 font-medium">
              <div className="flex justify-between"><span>Patient:</span><span className="font-mono">patient@medai.com / Patient@1234</span></div>
              <div className="flex justify-between"><span>Doctor:</span><span className="font-mono">doctor@medai.com / Doctor@1234</span></div>
              <div className="flex justify-between"><span>Admin:</span><span className="font-mono">admin@medai.com / Admin@1234</span></div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-teal-600 font-black hover:text-teal-700 transition-colors">
                Register for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
