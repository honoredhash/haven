import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SiteLayout } from "./components/SiteLayout";
import AuthPage from "./pages/AuthPage";
import { OwnerDashboard, OwnerListings, SeekerDashboard } from "./pages/DashboardPages";
import HomePage from "./pages/HomePage";
import OwnerInquiriesPage from "./pages/OwnerInquiriesPage";
import OwnerPropertyFormPage from "./pages/OwnerPropertyFormPage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/:id" element={<PropertyDetailsPage />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="register" element={<AuthPage mode="register" />} />
          <Route element={<ProtectedRoute role="SEEKER" />}>
            <Route path="dashboard" element={<SeekerDashboard />} />
            <Route path="dashboard/inquiries" element={<SeekerDashboard />} />
          </Route>
          <Route element={<ProtectedRoute role="OWNER" />}>
            <Route path="owner" element={<OwnerDashboard />} />
            <Route path="owner/properties" element={<OwnerListings />} />
            <Route path="owner/properties/new" element={<OwnerPropertyFormPage />} />
            <Route path="owner/properties/:id/edit" element={<OwnerPropertyFormPage editing />} />
            <Route path="owner/inquiries" element={<OwnerInquiriesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
