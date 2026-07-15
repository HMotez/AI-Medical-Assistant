import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import {
  User, Mail, Phone, CalendarDays, Save, Trash2,
  CheckCircle, AlertCircle, Loader2, Shield
} from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    age:       user?.age || "",
    gender:    user?.gender || "male",
    phone:     user?.phone || "",
  });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess(false);
    try {
      await axiosClient.put("/api/users/me", {
        full_name: form.full_name,
        age:       form.age ? parseInt(form.age) : undefined,
        gender:    form.gender,
        phone:     form.phone || undefined,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await axiosClient.delete("/api/users/me");
      logout();
      navigate("/");
    } catch {
      setError("Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/25">
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Account Settings</p>
          <h1 className="text-2xl font-black text-white">My Profile</h1>
          <p className="text-white/50 text-sm mt-0.5">{user?.email}</p>
        </div>
      </div>

      <div className="max-w-3xl space-y-5">

        {/* Profile form card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10 flex items-center gap-2">
            <User className="w-5 h-5 text-teal-400" />
            <h2 className="font-black text-white text-lg">Personal Information</h2>
          </div>
          <form onSubmit={save} className="p-6 space-y-5">

            {success && (
              <div className="flex items-center gap-3 bg-green-500/20 border border-green-400/30 text-green-300 text-sm font-medium px-4 py-3 rounded-xl">
                <CheckCircle className="w-5 h-5 shrink-0" /> Profile updated successfully!
              </div>
            )}
            {error && (
              <div className="flex items-center gap-3 bg-red-500/20 border border-red-400/30 text-red-300 text-sm font-medium px-4 py-3 rounded-xl">
                <AlertCircle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-bold text-white/70 mb-2">
                Email Address <span className="text-white/30 font-normal">(cannot be changed)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="email" readOnly value={user?.email || ""}
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white/40 text-sm cursor-not-allowed" />
              </div>
            </div>

            {/* Full name */}
            <div>
              <label className="block text-sm font-bold text-white/70 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" required
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all"
                  placeholder="Your full name"
                  value={form.full_name} onChange={set("full_name")} />
              </div>
            </div>

            {/* Age + gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-white/70 mb-2">Age</label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="number" min="1" max="120"
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all"
                    placeholder="Age" value={form.age} onChange={set("age")} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-white/70 mb-2">Gender</label>
                <select
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white text-sm font-semibold focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all"
                  value={form.gender} onChange={set("gender")}>
                  <option value="male" className="bg-gray-800">Male</option>
                  <option value="female" className="bg-gray-800">Female</option>
                  <option value="other" className="bg-gray-800">Other</option>
                </select>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-white/70 mb-2">
                Phone <span className="text-white/30 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="tel"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all"
                  placeholder="+1 555 000 0000"
                  value={form.phone} onChange={set("phone")} />
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn-primary gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </form>
        </div>

        {/* Security card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="font-black text-white text-lg mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" /> Account Security
          </h2>
          <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-400/20 rounded-xl">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-white text-sm">Password</div>
              <div className="text-xs text-white/40 mt-0.5">To change your password, log out and use the forgot password flow.</div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-6">
          <h2 className="font-black text-red-400 text-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Danger Zone
          </h2>
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-red-500/10 border border-red-400/20 rounded-xl">
            <div>
              <div className="font-bold text-white text-sm">Delete My Account</div>
              <div className="text-xs text-white/40 mt-0.5">
                Permanently delete your account and all associated data. This cannot be undone.
              </div>
            </div>
            <button onClick={deleteAccount} disabled={deleting} className="btn-danger gap-2 shrink-0">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
