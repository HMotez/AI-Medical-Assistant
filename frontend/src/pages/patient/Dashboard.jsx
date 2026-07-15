import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import {
  Activity, Plus, Clock, ChevronRight, AlertTriangle,
  CheckCircle, AlertCircle, Zap, FileText, User, Stethoscope
} from "lucide-react";

const URGENCY_META = {
  low:       { label: "Low",       cls: "urgency-low",       Icon: CheckCircle },
  moderate:  { label: "Moderate",  cls: "urgency-moderate",  Icon: AlertCircle },
  high:      { label: "High",      cls: "urgency-high",      Icon: AlertTriangle },
  emergency: { label: "Emergency", cls: "urgency-emergency", Icon: Zap },
};

function UrgencyBadge({ level }) {
  const { label, cls, Icon } = URGENCY_META[level] || URGENCY_META.low;
  return <span className={cls}><Icon className="w-3 h-3" /> {label}</span>;
}

const QUICK = [
  { to: "/patient/analyze", Icon: Plus,  label: "New Analysis", sub: "Check your symptoms now",  color: "from-teal-400 to-emerald-500" },
  { to: "/patient/history", Icon: Clock, label: "My History",   sub: "View past analyses",        color: "from-blue-400 to-cyan-500" },
  { to: "/patient/profile", Icon: User,  label: "My Profile",   sub: "Manage your account",       color: "from-purple-400 to-violet-500" },
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    axiosClient.get("/api/analysis/")
      .then(r => setAnalyses(r.data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/25">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <div>
          <p className="text-teal-300 text-xs font-black uppercase tracking-widest mb-1">Patient Portal</p>
          <h1 className="text-3xl font-black text-white">Hello, {user?.full_name?.split(" ")[0]} 👋</h1>
          <p className="text-white/50 text-sm mt-0.5">Here's your health overview</p>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">

        {/* Quick actions */}
        <div className="grid md:grid-cols-3 gap-4">
          {QUICK.map(({ to, Icon, label, sub, color }) => (
            <Link key={to} to={to}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex items-center gap-4 group hover:-translate-y-1 hover:bg-white/15 hover:border-white/30 transition-all duration-200">
              <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-white">{label}</div>
                <div className="text-xs text-white/50 mt-0.5">{sub}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-teal-300 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Recent analyses */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <h2 className="font-black text-white flex items-center gap-2.5 text-lg">
              <Activity className="w-5 h-5 text-teal-400" /> Recent Analyses
            </h2>
            <Link to="/patient/history" className="text-sm font-bold text-teal-300 hover:text-teal-200 flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-white/30" />
              </div>
              <p className="font-black text-white/70 mb-1 text-lg">No analyses yet</p>
              <p className="text-sm text-white/40 mb-6">Start your first AI symptom analysis</p>
              <Link to="/patient/analyze" className="btn-primary text-sm gap-2">
                <Plus className="w-4 h-4" /> Start First Analysis
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {analyses.map(a => (
                <Link key={a.id} to={`/patient/results/${a.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/8 group transition-colors">
                  <div className="w-11 h-11 bg-teal-500/20 rounded-xl flex items-center justify-center shrink-0 border border-teal-400/20">
                    <FileText className="w-5 h-5 text-teal-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">
                      {a.top_disease || "Analysis #" + a.id}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {new Date(a.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </div>
                  </div>
                  <UrgencyBadge level={a.urgency_level} />
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-teal-300 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
