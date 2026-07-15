import { useState } from "react";
import {
  Microscope, Search, Activity, Shield,
  ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";

const URGENCY_GLASS = {
  low:       "bg-green-500/20 text-green-300 border-green-400/30",
  moderate:  "bg-amber-500/20 text-amber-300 border-amber-400/30",
  high:      "bg-orange-500/20 text-orange-300 border-orange-400/30",
  emergency: "bg-red-500/20 text-red-300 border-red-400/30",
};

const DISEASE_INFO = [
  { name: "Fungal infection",          specialist: "Dermatologist",    urgency: "low" },
  { name: "Allergy",                   specialist: "Allergologist",    urgency: "low" },
  { name: "GERD",                      specialist: "Gastroenterologist", urgency: "moderate" },
  { name: "Chronic cholestasis",       specialist: "Gastroenterologist", urgency: "high" },
  { name: "Drug Reaction",             specialist: "Dermatologist",    urgency: "moderate" },
  { name: "Peptic ulcer disease",      specialist: "Gastroenterologist", urgency: "moderate" },
  { name: "AIDS",                      specialist: "Infectious Disease Specialist", urgency: "emergency" },
  { name: "Diabetes",                  specialist: "Endocrinologist",  urgency: "high" },
  { name: "Gastroenteritis",           specialist: "Gastroenterologist", urgency: "moderate" },
  { name: "Bronchial Asthma",          specialist: "Pulmonologist",    urgency: "high" },
  { name: "Hypertension",              specialist: "Cardiologist",     urgency: "high" },
  { name: "Migraine",                  specialist: "Neurologist",      urgency: "moderate" },
  { name: "Cervical spondylosis",      specialist: "Orthopedist",      urgency: "moderate" },
  { name: "Paralysis (brain hemorrhage)", specialist: "Neurologist",   urgency: "emergency" },
  { name: "Jaundice",                  specialist: "Gastroenterologist", urgency: "high" },
  { name: "Malaria",                   specialist: "Infectious Disease Specialist", urgency: "high" },
  { name: "Chicken pox",               specialist: "Dermatologist",    urgency: "moderate" },
  { name: "Dengue",                    specialist: "Infectious Disease Specialist", urgency: "high" },
  { name: "Typhoid",                   specialist: "Infectious Disease Specialist", urgency: "high" },
  { name: "Hepatitis A",               specialist: "Gastroenterologist", urgency: "high" },
  { name: "Hepatitis B",               specialist: "Gastroenterologist", urgency: "high" },
  { name: "Hepatitis C",               specialist: "Gastroenterologist", urgency: "high" },
  { name: "Hepatitis D",               specialist: "Gastroenterologist", urgency: "emergency" },
  { name: "Hepatitis E",               specialist: "Gastroenterologist", urgency: "high" },
  { name: "Alcoholic hepatitis",       specialist: "Gastroenterologist", urgency: "high" },
  { name: "Tuberculosis",              specialist: "Pulmonologist",    urgency: "high" },
  { name: "Common Cold",               specialist: "General Practitioner", urgency: "low" },
  { name: "Pneumonia",                 specialist: "Pulmonologist",    urgency: "high" },
  { name: "Dimorphic hemmorhoids(piles)", specialist: "Gastroenterologist", urgency: "moderate" },
  { name: "Heart attack",              specialist: "Cardiologist",     urgency: "emergency" },
  { name: "Varicose veins",            specialist: "Vascular Surgeon", urgency: "moderate" },
  { name: "Hypothyroidism",            specialist: "Endocrinologist",  urgency: "moderate" },
  { name: "Hyperthyroidism",           specialist: "Endocrinologist",  urgency: "moderate" },
  { name: "Hypoglycemia",              specialist: "Endocrinologist",  urgency: "high" },
  { name: "Osteoarthritis",            specialist: "Orthopedist",      urgency: "moderate" },
  { name: "Arthritis",                 specialist: "Rheumatologist",   urgency: "moderate" },
  { name: "(Vertigo) Paroxysmal Positional Vertigo", specialist: "Neurologist", urgency: "moderate" },
  { name: "Acne",                      specialist: "Dermatologist",    urgency: "low" },
  { name: "Urinary tract infection",   specialist: "Urologist",        urgency: "moderate" },
  { name: "Psoriasis",                 specialist: "Dermatologist",    urgency: "low" },
  { name: "Impetigo",                  specialist: "Dermatologist",    urgency: "moderate" },
];

const SYMPTOMS_SAMPLE = [
  "itching", "skin_rash", "continuous_sneezing", "shivering", "chills", "joint_pain",
  "stomach_pain", "acidity", "vomiting", "fatigue", "weight_gain", "anxiety",
  "mood_swings", "weight_loss", "lethargy", "cough", "high_fever", "breathlessness",
  "sweating", "dehydration", "headache", "nausea", "loss_of_appetite", "back_pain",
  "constipation", "abdominal_pain", "diarrhoea", "chest_pain", "fast_heart_rate",
  "neck_stiffness", "loss_of_balance", "muscle_pain", "depression", "palpitations",
].sort();

export default function AdminDiseases() {
  const [tab, setTab]           = useState("diseases");
  const [query, setQuery]       = useState("");
  const [sortUrgency, setSort]  = useState(null);
  const [expanded, setExpanded] = useState(null);

  const filtered = DISEASE_INFO.filter(d =>
    !query ||
    d.name.toLowerCase().includes(query.toLowerCase()) ||
    d.specialist.toLowerCase().includes(query.toLowerCase())
  );

  const sorted = sortUrgency
    ? [...filtered].sort((a, b) => {
        const order = { emergency: 0, high: 1, moderate: 2, low: 3 };
        return order[a.urgency] - order[b.urgency];
      })
    : filtered;

  const filteredSymptoms = SYMPTOMS_SAMPLE.filter(s =>
    !query || s.replace(/_/g, " ").includes(query.toLowerCase())
  );

  const urgencyCounts = {
    emergency: DISEASE_INFO.filter(d => d.urgency === "emergency").length,
    high:      DISEASE_INFO.filter(d => d.urgency === "high").length,
    moderate:  DISEASE_INFO.filter(d => d.urgency === "moderate").length,
    low:       DISEASE_INFO.filter(d => d.urgency === "low").length,
  };

  return (
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/25">
          <Microscope className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Medical Database</p>
          <h1 className="text-2xl font-black text-white">Diseases & Symptoms</h1>
          <p className="text-white/50 text-sm mt-0.5">
            {DISEASE_INFO.length} diseases · {SYMPTOMS_SAMPLE.length}+ symptoms
          </p>
        </div>
      </div>

      <div className="max-w-5xl space-y-5">

        {/* Urgency summary */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Emergency", count: urgencyCounts.emergency, color: "from-red-500/20 to-red-600/20",    border: "border-red-400/30",    dot: "bg-red-400",    text: "text-red-300" },
            { label: "High",      count: urgencyCounts.high,      color: "from-orange-500/20 to-orange-600/20", border: "border-orange-400/30", dot: "bg-orange-400", text: "text-orange-300" },
            { label: "Moderate",  count: urgencyCounts.moderate,  color: "from-amber-500/20 to-amber-600/20",  border: "border-amber-400/30",  dot: "bg-amber-400",  text: "text-amber-300" },
            { label: "Low",       count: urgencyCounts.low,       color: "from-green-500/20 to-green-600/20",  border: "border-green-400/30",  dot: "bg-green-400",  text: "text-green-300" },
          ].map(({ label, count, color, border, dot, text }) => (
            <div key={label} className={`bg-gradient-to-br ${color} backdrop-blur-md border ${border} rounded-2xl p-4 text-center`}>
              <div className={`w-3 h-3 ${dot} rounded-full mx-auto mb-2`} />
              <div className={`text-2xl font-black ${text}`}>{count}</div>
              <div className="text-xs font-bold text-white/50">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => { setTab("diseases"); setQuery(""); }}
              className={`flex-1 py-4 text-sm font-black transition-colors flex items-center justify-center gap-2
                ${tab === "diseases" ? "bg-teal-500/20 text-teal-300 border-b-2 border-teal-400" : "text-white/50 hover:text-teal-300"}`}>
              <Microscope className="w-4 h-4" /> Diseases ({DISEASE_INFO.length})
            </button>
            <button
              onClick={() => { setTab("symptoms"); setQuery(""); }}
              className={`flex-1 py-4 text-sm font-black transition-colors flex items-center justify-center gap-2
                ${tab === "symptoms" ? "bg-teal-500/20 text-teal-300 border-b-2 border-teal-400" : "text-white/50 hover:text-teal-300"}`}>
              <Activity className="w-4 h-4" /> Symptoms ({SYMPTOMS_SAMPLE.length}+)
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text" placeholder={tab === "diseases" ? "Search diseases or specialists..." : "Search symptoms..."}
                value={query} onChange={e => setQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all" />
            </div>
            {tab === "diseases" && (
              <button
                onClick={() => setSort(s => s ? null : "urgency")}
                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all
                  ${sortUrgency ? "bg-teal-500 text-white border-teal-500" : "border-white/20 text-white/60 hover:border-teal-400/50 hover:text-teal-300"}`}>
                Sort by urgency {sortUrgency ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Diseases tab */}
          {tab === "diseases" && (
            <div className="divide-y divide-white/5">
              {sorted.map((d, i) => (
                <div key={i}>
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/8 transition-colors text-left">
                    <div className="w-10 h-10 bg-teal-500/20 border border-teal-400/20 rounded-xl flex items-center justify-center shrink-0">
                      <Microscope className="w-5 h-5 text-teal-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm">{d.name}</div>
                      <div className="text-xs text-white/40 mt-0.5">{d.specialist}</div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${URGENCY_GLASS[d.urgency]}`}>
                      {d.urgency}
                    </span>
                    {expanded === i
                      ? <ChevronUp className="w-4 h-4 text-white/40 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
                  </button>
                  {expanded === i && (
                    <div className="px-6 pb-4">
                      <div className="bg-white/8 border border-white/10 rounded-xl p-4 ml-14 grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-black text-white/30 uppercase mb-1">Recommended Specialist</div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-teal-400" /> {d.specialist}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-black text-white/30 uppercase mb-1">Urgency Level</div>
                          <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full border inline-block ${URGENCY_GLASS[d.urgency]}`}>
                            {d.urgency.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {sorted.length === 0 && (
                <p className="text-center text-white/40 font-bold py-10">No diseases found.</p>
              )}
            </div>
          )}

          {/* Symptoms tab */}
          {tab === "symptoms" && (
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {filteredSymptoms.map((s, i) => (
                  <span key={i}
                    className="bg-teal-500/15 text-teal-200 border border-teal-400/25 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-teal-500/25 transition-colors">
                    {s.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
              {filteredSymptoms.length === 0 && (
                <p className="text-center text-white/40 font-bold py-8">No symptoms found.</p>
              )}
              <div className="mt-5 pt-4 border-t border-white/10 text-center">
                <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-semibold px-4 py-2 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  Full list: 132 symptoms from the training dataset (4,920 cases)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
