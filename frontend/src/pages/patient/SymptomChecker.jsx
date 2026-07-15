import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { Search, X, Activity, AlertCircle, Loader2, CheckCircle, ClipboardList } from "lucide-react";

const ALL_SYMPTOMS = [
  "itching","skin_rash","nodal_skin_eruptions","continuous_sneezing","shivering","chills","joint_pain",
  "stomach_pain","acidity","ulcers_on_tongue","muscle_wasting","vomiting","burning_micturition",
  "spotting_urination","fatigue","weight_gain","anxiety","cold_hands_and_feets","mood_swings",
  "weight_loss","restlessness","lethargy","patches_in_throat","irregular_sugar_level","cough",
  "high_fever","sunken_eyes","breathlessness","sweating","dehydration","indigestion","headache",
  "yellowish_skin","dark_urine","nausea","loss_of_appetite","pain_behind_the_eyes","back_pain",
  "constipation","abdominal_pain","diarrhoea","mild_fever","yellow_urine","yellowing_of_eyes",
  "acute_liver_failure","swelling_of_stomach","swelled_lymph_nodes","malaise",
  "blurred_and_distorted_vision","phlegm","throat_irritation","redness_of_eyes","sinus_pressure",
  "runny_nose","congestion","chest_pain","weakness_in_limbs","fast_heart_rate",
  "pain_during_bowel_movements","pain_in_anal_region","bloody_stool","irritation_in_anus",
  "neck_stiffness","loss_of_balance","unsteadiness","weakness_of_one_body_side",
  "loss_of_smell","bladder_discomfort","foul_smell_of_urine","continuous_feel_of_urine","passage_of_gases",
  "internal_itching","depression","irritability","muscle_pain","altered_sensorium",
  "red_spots_over_body","belly_pain","abnormal_menstruation","watering_from_eyes","increased_appetite",
  "polyuria","family_history","mucoid_sputum","rusty_sputum","lack_of_concentration","visual_disturbances",
  "receiving_blood_transfusion","receiving_unsterile_injections","coma","stomach_bleeding",
  "distention_of_abdomen","history_of_alcohol_consumption","blood_in_sputum","prominent_veins_on_calf",
  "palpitations","painful_walking","pus_filled_pimples","blackheads","skin_peeling",
  "silver_like_dusting","small_dents_in_nails","inflammatory_nails","blister","red_sore_around_nose",
  "yellow_crust_ooze",
];

const fmt = (s) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [selected, setSelected]   = useState([]);
  const [query, setQuery]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const filtered = useMemo(() =>
    ALL_SYMPTOMS.filter(s =>
      s.includes(query.toLowerCase().replace(/\s+/g, "_")) ||
      fmt(s).toLowerCase().includes(query.toLowerCase())
    ), [query]);

  const toggle = (s) =>
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const submit = async () => {
    if (selected.length < 1) { setError("Please select at least 1 symptom."); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await axiosClient.post("/api/analysis", { symptom_names: selected });
      navigate(`/patient/results/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/25">
          <ClipboardList className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-blue-300 text-xs font-black uppercase tracking-widest mb-1">Step 1 of 2</p>
          <h1 className="text-2xl font-black text-white">Symptom Checker</h1>
          <p className="text-white/50 text-sm mt-0.5">Select all your current symptoms, then click Analyze</p>
        </div>
      </div>

      <div className="max-w-4xl space-y-5">

        {/* Selected tags */}
        {selected.length > 0 && (
          <div className="bg-teal-500/15 backdrop-blur-md border border-teal-400/30 rounded-2xl p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-teal-400" />
              <span className="font-black text-white">Selected symptoms ({selected.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.map(s => (
                <button key={s} onClick={() => toggle(s)}
                  className="flex items-center gap-1.5 bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-teal-600 transition-colors">
                  {fmt(s)} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search + grid */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search symptoms (e.g. fever, headache, cough...)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all"
            />
          </div>

          <div className="text-xs font-black text-white/40 uppercase tracking-wider mb-3">
            {filtered.length} symptoms {query && `matching "${query}"`}
          </div>

          <div className="max-h-96 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {filtered.map(s => {
                const isSel = selected.includes(s);
                return (
                  <button key={s} onClick={() => toggle(s)}
                    className={`text-left text-xs px-3.5 py-3 rounded-xl border transition-all font-semibold
                      ${isSel
                        ? "bg-teal-500 text-white border-teal-500 shadow-md scale-[0.98]"
                        : "border-white/15 bg-white/5 text-white/70 hover:border-teal-400/50 hover:bg-teal-500/15 hover:text-white"}`}>
                    {fmt(s)}
                  </button>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-white/40 font-bold py-8">No symptoms match your search.</p>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/20 border border-red-400/30 text-red-300 text-sm font-medium px-4 py-3 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        <button onClick={submit} disabled={loading || selected.length === 0}
          className="btn-primary w-full py-4 text-base font-black disabled:opacity-50 gap-2 shadow-teal">
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing your symptoms...</>
            : <><Activity className="w-5 h-5" />
                {selected.length > 0 ? `Analyze ${selected.length} Symptom${selected.length > 1 ? "s" : ""}` : "Select symptoms first"}
              </>}
        </button>
      </div>
    </div>
  );
}
