import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui";

// Layout
import AppShell from "./components/layout/AppShell";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Public pages
import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import Contacts from "./pages/Contacts";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Farmer pages
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import FarmerProfile from "./pages/farmer/FarmerProfile";
import CropManagement from "./pages/farmer/CropManagement";
import CollectiveBrowse from "./pages/farmer/CollectiveBrowse";
import FarmerSchedules from "./pages/farmer/FarmerSchedules";
import FarmerNotifications from "./pages/farmer/FarmerNotifications";
import FarmerSettings from "./pages/farmer/FarmerSettings";

// Collective pages
import CollectiveDashboard from "./pages/collective/CollectiveDashboard";
import CollectiveProfile from "./pages/collective/CollectiveProfile";
import FarmerGroupManagement from "./pages/collective/FarmerGroupManagement";
import CropInventory from "./pages/collective/CropInventory";
import DriverManagement from "./pages/collective/DriverManagement";
import ZoneManagement from "./pages/collective/ZoneManagement";
import PickupScheduler from "./pages/collective/PickupScheduler";
import CollectionHistory from "./pages/collective/CollectionHistory";
import Announcements from "./pages/collective/Announcements";
import CollectiveNotifications from "./pages/collective/CollectiveNotifications";
import CollectiveSettings from "./pages/collective/CollectiveSettings";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import FarmerGroupAdmin from "./pages/admin/FarmerGroupAdmin";
import CollectiveAdmin from "./pages/admin/CollectiveAdmin";
import IssueResolution from "./pages/admin/IssueResolution";
import AdminSettings from "./pages/admin/AdminSettings";

// Common pages
import ProfilePage from "./pages/common/ProfilePage";
import SettingsPage from "./pages/common/SettingsPage";

// ──────────────────────────────────────────────────
// Route guards
// ──────────────────────────────────────────────────

/** Redirect logged-in users away from auth pages */
const GuestRoute = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return children;
  if (role === "FARMER_GROUP") return <Navigate to="/dashboard/farmer/overview" replace />;
  if (role === "COLLECTIVE") return <Navigate to="/dashboard/collective/overview" replace />;
  if (role === "ADMIN") return <Navigate to="/dashboard/admin/overview" replace />;
  return children;
};

/** Require auth to access */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return children;
};

/** Public layout (Navbar + Footer) */
const GuestLayout = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// ──────────────────────────────────────────────────
// App
// ──────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* ── Public (guest) layout ── */}
              <Route element={<GuestLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/features" element={<Features />} />
                <Route path="/contact" element={<Contacts />} />
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
              </Route>

              {/* ── Authenticated shell ── */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                {/* ── Farmer Group routes ── */}
                <Route
                  path="farmer/overview"
                  element={<ProtectedRoute allowedRoles={["FARMER_GROUP"]}><FarmerDashboard /></ProtectedRoute>}
                />
                <Route
                  path="farmer/profile"
                  element={<ProtectedRoute allowedRoles={["FARMER_GROUP"]}><FarmerProfile /></ProtectedRoute>}
                />
                <Route
                  path="farmer/crops"
                  element={<ProtectedRoute allowedRoles={["FARMER_GROUP"]}><CropManagement /></ProtectedRoute>}
                />
                <Route
                  path="farmer/collectives"
                  element={<ProtectedRoute allowedRoles={["FARMER_GROUP"]}><CollectiveBrowse /></ProtectedRoute>}
                />
                <Route
                  path="farmer/schedules"
                  element={<ProtectedRoute allowedRoles={["FARMER_GROUP"]}><FarmerSchedules /></ProtectedRoute>}
                />
                <Route
                  path="farmer/notifications"
                  element={<ProtectedRoute allowedRoles={["FARMER_GROUP"]}><FarmerNotifications /></ProtectedRoute>}
                />
                <Route
                  path="farmer/settings"
                  element={<ProtectedRoute allowedRoles={["FARMER_GROUP"]}><FarmerSettings /></ProtectedRoute>}
                />

                {/* ── Collective routes ── */}
                <Route
                  path="collective/overview"
                  element={<ProtectedRoute allowedRoles={["COLLECTIVE"]}><CollectiveDashboard /></ProtectedRoute>}
                />
                <Route
                  path="collective/profile"
                  element={<ProtectedRoute allowedRoles={["COLLECTIVE"]}><CollectiveProfile /></ProtectedRoute>}
                />
                <Route
                  path="collective/farmers"
                  element={<ProtectedRoute allowedRoles={["COLLECTIVE"]}><FarmerGroupManagement /></ProtectedRoute>}
                />
                <Route
                  path="collective/crops"
                  element={<ProtectedRoute allowedRoles={["COLLECTIVE"]}><CropInventory /></ProtectedRoute>}
                />
                <Route
                  path="collective/drivers"
                  element={<ProtectedRoute allowedRoles={["COLLECTIVE"]}><DriverManagement /></ProtectedRoute>}
                />
                <Route
                  path="collective/zones"
                  element={<ProtectedRoute allowedRoles={["COLLECTIVE"]}><ZoneManagement /></ProtectedRoute>}
                />
                <Route
                  path="collective/schedules"
                  element={<ProtectedRoute allowedRoles={["COLLECTIVE"]}><PickupScheduler /></ProtectedRoute>}
                />
                <Route
                  path="collective/history"
                  element={<ProtectedRoute allowedRoles={["COLLECTIVE"]}><CollectionHistory /></ProtectedRoute>}
                />
                <Route
                  path="collective/announcements"
                  element={<ProtectedRoute allowedRoles={["COLLECTIVE"]}><Announcements /></ProtectedRoute>}
                />
                <Route
                  path="collective/notifications"
                  element={<ProtectedRoute allowedRoles={["COLLECTIVE"]}><CollectiveNotifications /></ProtectedRoute>}
                />
                <Route
                  path="collective/settings"
                  element={<ProtectedRoute allowedRoles={["COLLECTIVE"]}><CollectiveSettings /></ProtectedRoute>}
                />

                {/* ── Admin routes ── */}
                <Route
                  path="admin/overview"
                  element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>}
                />
                <Route
                  path="admin/users"
                  element={<ProtectedRoute allowedRoles={["ADMIN"]}><UserManagement /></ProtectedRoute>}
                />
                <Route
                  path="admin/farmer-groups"
                  element={<ProtectedRoute allowedRoles={["ADMIN"]}><FarmerGroupAdmin /></ProtectedRoute>}
                />
                <Route
                  path="admin/collectives"
                  element={<ProtectedRoute allowedRoles={["ADMIN"]}><CollectiveAdmin /></ProtectedRoute>}
                />
                <Route
                  path="admin/issues"
                  element={<ProtectedRoute allowedRoles={["ADMIN"]}><IssueResolution /></ProtectedRoute>}
                />
                <Route
                  path="admin/settings"
                  element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminSettings /></ProtectedRoute>}
                />

                {/* Default redirect */}
                <Route index element={<DashboardRedirect />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const DashboardRedirect = () => {
  const { role } = useAuth();
  if (role === "FARMER_GROUP") return <Navigate to="/dashboard/farmer/overview" replace />;
  if (role === "COLLECTIVE") return <Navigate to="/dashboard/collective/overview" replace />;
  if (role === "ADMIN") return <Navigate to="/dashboard/admin/overview" replace />;
  return <Navigate to="/login" replace />;
};

export default App;
