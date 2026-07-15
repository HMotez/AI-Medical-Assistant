import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar  from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import { PHOTOS } from "./constants/photos";

/* Public */
import Landing   from "./pages/Landing";
import Login     from "./pages/auth/Login";
import Register  from "./pages/auth/Register";
import NotFound  from "./pages/NotFound";

/* Patient */
import PatientDashboard from "./pages/patient/Dashboard";
import SymptomChecker   from "./pages/patient/SymptomChecker";
import Results          from "./pages/patient/Results";
import History          from "./pages/patient/History";
import Profile          from "./pages/patient/Profile";
import MedicalChat      from "./pages/patient/MedicalChat";
import HealthTrends     from "./pages/patient/HealthTrends";

/* Doctor */
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import AnalysisDetail  from "./pages/doctor/AnalysisDetail";

/* Admin */
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStats     from "./pages/admin/AdminStats";
import AdminDiseases  from "./pages/admin/AdminDiseases";

function PatientRoute({ children }) {
  return <ProtectedRoute roles={["patient"]}>{children}</ProtectedRoute>;
}
function DoctorRoute({ children }) {
  return <ProtectedRoute roles={["doctor"]}>{children}</ProtectedRoute>;
}
function AdminRoute({ children }) {
  return <ProtectedRoute roles={["admin"]}>{children}</ProtectedRoute>;
}

/* Route → photo mapping */
const ROUTE_PHOTOS = [
  { match: "/patient/analyze",    photo: PHOTOS.symptomChecker },
  { match: "/patient/results",    photo: PHOTOS.results },
  { match: "/patient/history",    photo: PHOTOS.history },
  { match: "/patient/profile",    photo: PHOTOS.patientDash },
  { match: "/patient/chat",       photo: PHOTOS.doctorDash },
  { match: "/patient/trends",     photo: PHOTOS.history },
  { match: "/patient",            photo: PHOTOS.patientDash },
  { match: "/doctor/analysis",    photo: PHOTOS.results },
  { match: "/doctor",             photo: PHOTOS.doctorDash },
  { match: "/admin/stats",        photo: PHOTOS.adminDash },
  { match: "/admin/diseases",     photo: PHOTOS.results },
  { match: "/admin",              photo: PHOTOS.adminDash },
];

function getPhoto(pathname) {
  for (const { match, photo } of ROUTE_PHOTOS) {
    if (pathname === match || pathname.startsWith(match + "/")) return photo;
  }
  return PHOTOS.patientDash;
}

/* Landing — top navbar only */
function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

/* Authenticated — sidebar + full photo background per page */
function SidebarLayout() {
  const { pathname } = useLocation();
  const photo = getPhoto(pathname);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto relative"
        style={{
          backgroundImage: `url(${photo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay so content stays readable */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(6,14,28,0.9) 0%, rgba(6,26,36,0.88) 100%)" }}
        />
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── Landing (top navbar) ──────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
          </Route>

          {/* ── Auth pages (standalone) ───────────────────────────── */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Patient (sidebar + photo bg) ─────────────────────── */}
          <Route element={<SidebarLayout />}>
            <Route path="/patient"             element={<PatientRoute><PatientDashboard /></PatientRoute>} />
            <Route path="/patient/analyze"     element={<PatientRoute><SymptomChecker /></PatientRoute>} />
            <Route path="/patient/results/:id" element={<PatientRoute><Results /></PatientRoute>} />
            <Route path="/patient/history"     element={<PatientRoute><History /></PatientRoute>} />
            <Route path="/patient/profile"     element={<PatientRoute><Profile /></PatientRoute>} />
            <Route path="/patient/chat"        element={<PatientRoute><MedicalChat /></PatientRoute>} />
            <Route path="/patient/trends"      element={<PatientRoute><HealthTrends /></PatientRoute>} />
          </Route>

          {/* ── Doctor (sidebar + photo bg) ──────────────────────── */}
          <Route element={<SidebarLayout />}>
            <Route path="/doctor"              element={<DoctorRoute><DoctorDashboard /></DoctorRoute>} />
            <Route path="/doctor/analysis/:id" element={<DoctorRoute><AnalysisDetail /></DoctorRoute>} />
          </Route>

          {/* ── Admin (sidebar + photo bg) ───────────────────────── */}
          <Route element={<SidebarLayout />}>
            <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/stats"    element={<AdminRoute><AdminStats /></AdminRoute>} />
            <Route path="/admin/diseases" element={<AdminRoute><AdminDiseases /></AdminRoute>} />
          </Route>

          {/* ── 404 ──────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
