import { useRef } from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DocumentTitle from "./components/DocumentTitle";
import Navbar   from "./components/layout/Navbar";
import AppFrame from "./components/layout/AppFrame";
import PhotoBackdrop from "./components/layout/PhotoBackdrop";
import useRiseIn from "./components/ui/useRiseIn";

/* Public */
import Landing   from "./pages/Landing";
import Login     from "./pages/auth/Login";
import Register  from "./pages/auth/Register";
import NotFound  from "./pages/NotFound";
import Profile   from "./pages/Profile";

/* Patient */
import PatientDashboard from "./pages/patient/Dashboard";
import SymptomChecker   from "./pages/patient/SymptomChecker";
import Results          from "./pages/patient/Results";
import History          from "./pages/patient/History";
import MedicalChat      from "./pages/patient/MedicalChat";
import HealthTrends     from "./pages/patient/HealthTrends";

/* Doctor */
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import AnalysisDetail  from "./pages/doctor/AnalysisDetail";
import Verification    from "./pages/doctor/Verification";

/* Admin */
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStats     from "./pages/admin/AdminStats";
import AdminDiseases  from "./pages/admin/AdminDiseases";
import AdminVerifications from "./pages/admin/AdminVerifications";

function PatientRoute({ children }) {
  return <ProtectedRoute roles={["patient"]}>{children}</ProtectedRoute>;
}
/** Doctor pages need a verified account; until then the doctor sees their verification status. */
function DoctorGate({ children }) {
  const { user } = useAuth();
  return user?.doctor_status === "approved" ? children : <Verification />;
}
function DoctorRoute({ children }) {
  return <ProtectedRoute roles={["doctor"]}><DoctorGate>{children}</DoctorGate></ProtectedRoute>;
}
function AdminRoute({ children }) {
  return <ProtectedRoute roles={["admin"]}>{children}</ProtectedRoute>;
}

/* Landing — top bar inside the frame */
function PublicLayout() {
  const { pathname, search } = useLocation();
  const pageRef = useRef(null);
  useRiseIn(pageRef, pathname + search);
  return (
    <div className="relative min-h-screen">
      <PhotoBackdrop />
      <div className="app-frame min-h-screen p-3 sm:p-4 lg:p-5">
        <Navbar />
        <div key={pathname + search} ref={pageRef} className="page-enter pt-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DocumentTitle />
        <Routes>

          {/* ── Landing ──────────────────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
          </Route>

          {/* ── Auth pages (standalone) ──────────────────────────── */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Signed-in app: one frame with sidebar ────────────── */}
          <Route element={<AppFrame />}>
            <Route path="/patient"             element={<PatientRoute><PatientDashboard /></PatientRoute>} />
            <Route path="/patient/analyze"     element={<PatientRoute><SymptomChecker /></PatientRoute>} />
            <Route path="/patient/results/:id" element={<PatientRoute><Results /></PatientRoute>} />
            <Route path="/patient/history"     element={<PatientRoute><History /></PatientRoute>} />
            <Route path="/patient/profile"     element={<PatientRoute><Profile /></PatientRoute>} />
            <Route path="/patient/chat"        element={<PatientRoute><MedicalChat /></PatientRoute>} />
            <Route path="/patient/trends"      element={<PatientRoute><HealthTrends /></PatientRoute>} />

            <Route path="/doctor"              element={<DoctorRoute><DoctorDashboard /></DoctorRoute>} />
            <Route path="/doctor/analysis/:id" element={<DoctorRoute><AnalysisDetail /></DoctorRoute>} />
            <Route path="/doctor/profile"      element={<ProtectedRoute roles={["doctor"]}><Profile /></ProtectedRoute>} />

            <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/stats"    element={<AdminRoute><AdminStats /></AdminRoute>} />
            <Route path="/admin/diseases" element={<AdminRoute><AdminDiseases /></AdminRoute>} />
            <Route path="/admin/verifications" element={<AdminRoute><AdminVerifications /></AdminRoute>} />
            <Route path="/admin/profile"  element={<AdminRoute><Profile /></AdminRoute>} />
          </Route>

          {/* ── 404 ──────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
