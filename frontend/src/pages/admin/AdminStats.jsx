import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import {
  BarChart2, Activity, Users, Stethoscope, FileText,
  TrendingUp, AlertTriangle, Zap, CheckCircle, AlertCircle,
  Loader2
} from "lucide-react";

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="w-28 text-sm font-semibold text-white/70 text-right shrink-0">{label}</div>
      <div className="flex-1 h-8 bg-white/10 rounded-full overflow-hidden border border-white/10">
        <div
          className={`h-full ${color} rounded-full flex items-center pl-3 transition-all duration-700`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        >
          <span className="text-white text-xs font-black">{value}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, Icon, gradient, sub }) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-all">
      <div className={`bg-gradient-to-r ${gradient} px-5 py-4 flex items-center gap-3`}>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-white/85 text-xs font-black uppercase tracking-wide">{label}</span>
      </div>
      <div className="px-5 py-4">
        <div className="text-4xl font-black text-white">{value ?? "—"}</div>
        {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminStats() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get("/api/admin/stats")
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
    </div>
  );

  const urgencyData = [
    { label: "Emergency", value: stats?.urgency_emergency ?? 0, color: "bg-red-500",    Icon: Zap,           cls: "urgency-emergency" },
    { label: "High",      value: stats?.urgency_high      ?? 0, color: "bg-orange-500", Icon: AlertTriangle, cls: "urgency-high" },
    { label: "Moderate",  value: stats?.urgency_moderate  ?? 0, color: "bg-amber-500",  Icon: AlertCircle,   cls: "urgency-moderate" },
    { label: "Low",       value: stats?.urgency_low       ?? 0, color: "bg-green-500",  Icon: CheckCircle,   cls: "urgency-low" },
  ];

  const roleData = [
    { label: "Patients", value: stats?.total_patients ?? 0, color: "bg-teal-500" },
    { label: "Doctors",  value: stats?.total_doctors  ?? 0, color: "bg-blue-500" },
    { label: "Admins",   value: stats?.total_admins   ?? 0, color: "bg-purple-500" },
  ];

  const maxUrgency = Math.max(...urgencyData.map(d => d.value), 1);
  const maxRole    = Math.max(...roleData.map(d => d.value), 1);

  return (
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/25">
          <BarChart2 className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Administration</p>
          <h1 className="text-2xl font-black text-white">Platform Statistics</h1>
          <p className="text-white/50 text-sm mt-0.5">Real-time overview of all platform activity</p>
        </div>
      </div>

      <div className="max-w-5xl space-y-6">

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users"  value={stats?.total_users}    Icon={Users}       gradient="from-blue-500 to-blue-700"    sub="registered accounts" />
          <StatCard label="Analyses"     value={stats?.total_analyses} Icon={Activity}    gradient="from-teal-500 to-teal-700"    sub="AI analyses run" />
          <StatCard label="Doctors"      value={stats?.total_doctors}  Icon={Stethoscope} gradient="from-purple-500 to-purple-700" sub="medical professionals" />
          <StatCard label="Reports"      value={stats?.total_reports}  Icon={FileText}    gradient="from-green-500 to-green-700"   sub="PDF generated" />
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Urgency distribution */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="font-black text-white text-lg mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-400" /> Urgency Distribution
            </h2>
            <p className="text-xs text-white/40 mb-6">Breakdown of all analyses by urgency level</p>
            <div className="space-y-4">
              {urgencyData.map(({ label, value, color, Icon, cls }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`${cls} text-xs`}>
                      <Icon className="w-3 h-3" /> {label}
                    </span>
                    <span className="text-sm font-black text-white">{value}</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-700`}
                      style={{ width: `${maxUrgency > 0 ? Math.max((value / maxUrgency) * 100, value > 0 ? 4 : 0) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-sm font-bold text-white/50">Total Analyses</span>
              <span className="text-xl font-black text-white">{stats?.total_analyses ?? 0}</span>
            </div>
          </div>

          {/* User roles */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="font-black text-white text-lg mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> User Role Breakdown
            </h2>
            <p className="text-xs text-white/40 mb-6">Distribution of users by role</p>
            <div className="space-y-5">
              {roleData.map(({ label, value, color }) => (
                <Bar key={label} label={label} value={value} max={maxRole} color={color} />
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex gap-3 justify-center">
                {roleData.map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs font-semibold text-white/60">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    {label}: <span className="font-black text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Platform health */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="font-black text-white text-lg mb-5 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" /> Platform Health
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Avg analyses / patient", value: stats?.total_patients > 0 ? ((stats?.total_analyses || 0) / stats.total_patients).toFixed(1) : "0", grad: "from-teal-500/20 to-teal-600/20", border: "border-teal-400/30", text: "text-teal-300" },
              { label: "Report generation rate", value: stats?.total_analyses > 0 ? `${Math.round(((stats?.total_reports || 0) / stats.total_analyses) * 100)}%` : "0%", grad: "from-blue-500/20 to-blue-600/20", border: "border-blue-400/30", text: "text-blue-300" },
              { label: "Emergency rate",          value: stats?.total_analyses > 0 ? `${Math.round(((stats?.urgency_emergency || 0) / stats.total_analyses) * 100)}%` : "0%", grad: "from-red-500/20 to-red-600/20", border: "border-red-400/30", text: "text-red-300" },
              { label: "Doctor coverage",         value: stats?.total_doctors > 0 && stats?.total_patients > 0 ? `1:${Math.round(stats.total_patients / stats.total_doctors)}` : "N/A", grad: "from-purple-500/20 to-purple-600/20", border: "border-purple-400/30", text: "text-purple-300" },
            ].map(({ label, value, grad, border, text }) => (
              <div key={label} className={`bg-gradient-to-br ${grad} border ${border} rounded-2xl p-4 text-center`}>
                <div className={`text-2xl font-black mb-1 ${text}`}>{value}</div>
                <div className="text-xs font-semibold text-white/50 leading-snug">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
