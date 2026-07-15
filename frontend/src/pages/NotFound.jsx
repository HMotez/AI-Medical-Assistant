import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, ArrowLeft, Stethoscope, AlertCircle } from "lucide-react";

export default function NotFound() {
  const { user } = useAuth();

  const dashPath =
    user?.role === "admin"  ? "/admin"  :
    user?.role === "doctor" ? "/doctor" : user ? "/patient" : "/";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#eaf6fb" }}>
      <div className="text-center max-w-md">

        {/* Icon */}
        <div className="w-24 h-24 bg-teal-50 border-4 border-teal-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-12 h-12 text-teal-400" />
        </div>

        {/* 404 number */}
        <div className="text-8xl font-black text-teal-500 leading-none mb-2">404</div>

        {/* Message */}
        <h1 className="text-2xl font-black text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-500 text-base leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary gap-2">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
          {user && (
            <Link to={dashPath} className="btn-outline gap-2">
              <Stethoscope className="w-4 h-4" /> My Dashboard
            </Link>
          )}
        </div>

        {/* Branding */}
        <div className="mt-10 flex items-center justify-center gap-2 text-gray-400 text-sm">
          <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-3.5 h-3.5 text-white" />
          </div>
          AI Medical Assistant
        </div>
      </div>
    </div>
  );
}
