import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  Clock, ChevronRight, Activity, Trash2, AlertCircle,
  AlertTriangle, CheckCircle, Zap, Search, Loader2, Plus
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

export default function History() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState("");
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    axiosClient.get("/api/analysis/").then(r => setAnalyses(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this analysis permanently?")) return;
    setDeleting(id);
    try {
      await axiosClient.delete(`/api/analysis/${id}`);
      setAnalyses(prev => prev.filter(a => a.id !== id));
    } finally { setDeleting(null); }
  };

  const filtered = analyses.filter(a =>
    !query || (a.top_disease || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/25">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Patient Records</p>
            <h1 className="text-2xl font-black text-white">Analysis History</h1>
            <p className="text-white/50 text-sm mt-0.5">{analyses.length} total analyses</p>
          </div>
        </div>
        <Link to="/patient/analyze" className="btn-primary text-sm gap-2 hidden sm:flex">
          <Plus className="w-4 h-4" /> New Analysis
        </Link>
      </div>

      <div className="max-w-4xl space-y-5">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input type="text" placeholder="Search by disease name..."
            value={query} onChange={e => setQuery(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-center py-16 px-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-white/30" />
            </div>
            <p className="font-black text-white/70 text-lg mb-1">
              {query ? "No results found" : "No analyses yet"}
            </p>
            <p className="text-white/40 text-sm mb-6">
              {query ? "Try a different search term." : "Start your first analysis right now."}
            </p>
            {!query && (
              <Link to="/patient/analyze" className="btn-primary inline-flex gap-2">
                <Plus className="w-4 h-4" /> Get Started
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <span className="font-black text-white">{filtered.length} analyses</span>
            </div>
            <div className="divide-y divide-white/5">
              {filtered.map(a => (
                <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/8 group transition-colors">
                  <div className="w-11 h-11 bg-teal-500/20 border border-teal-400/20 rounded-xl flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-teal-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm">
                      {a.top_disease || "Analysis #" + a.id}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {new Date(a.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                  <UrgencyBadge level={a.urgency_level} />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => remove(a.id)} disabled={deleting === a.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
                      {deleting === a.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                    <Link to={`/patient/results/${a.id}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-teal-300 hover:bg-teal-500/20 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
