import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import DashboardLayout from './components/layout/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ApisPage from './pages/ApisPage';
import ApiDetailPage from './pages/ApiDetailPage';
import ApiKeysPage from './pages/ApiKeysPage';
import UsagePage from './pages/UsagePage';
import BillingPage from './pages/BillingPage';
import PlaygroundPage from './pages/PlaygroundPage';
import SettingsPage from './pages/SettingsPage';
import WebhooksPage from './pages/WebhooksPage';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — public only */}
        <Route path="/" element={
          <PublicRoute><LandingPage /></PublicRoute>
        } />

        <Route path="/login" element={
          <PublicRoute><LoginPage /></PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute><RegisterPage /></PublicRoute>
        } />

        <Route path="/" element={
          <ProtectedRoute><DashboardLayout /></ProtectedRoute>
        }>
          <Route path="dashboard"   element={<DashboardPage />} />
          <Route path="apis"        element={<ApisPage />} />
          <Route path="apis/:id"    element={<ApiDetailPage />} />
          <Route path="keys"        element={<ApiKeysPage />} />
          <Route path="usage"       element={<UsagePage />} />
          <Route path="billing"     element={<BillingPage />} />
          <Route path="playground"  element={<PlaygroundPage />} />
          <Route path="settings"    element={<SettingsPage />} />
          <Route path="webhooks"    element={<WebhooksPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
