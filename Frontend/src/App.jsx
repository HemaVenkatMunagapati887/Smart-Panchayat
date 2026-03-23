import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Chatbot from './components/Chatbot/Chatbot';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import FileSurvey from './pages/FileComplaint';
import TrackComplaint from './pages/TrackComplaint';
import PensionPage from './pages/PensionPage';
import CertificatesPage from './pages/CertificatesPage';
import TaxPayments from './pages/TaxPayments';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AccountSettings from './pages/AccountSettings';
import SupportCenter from './pages/SupportCenter';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';

function ProtectedLayout() {
  const { isLoggedIn } = useApp();
  const location = useLocation();

  if (!isLoggedIn) {
    const redirect = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  return <Layout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/citizen" element={<CitizenDashboard />} />
          <Route path="/citizen/complaint" element={<FileSurvey />} />
          <Route path="/citizen/track" element={<TrackComplaint />} />
          <Route path="/citizen/pension" element={<PensionPage />} />
          <Route path="/citizen/certificates" element={<CertificatesPage />} />
          <Route path="/citizen/tax" element={<TaxPayments />} />
          <Route path="/citizen/announcements" element={<AnnouncementsPage />} />
          <Route path="/citizen/settings" element={<AccountSettings />} />
          <Route path="/citizen/support" element={<SupportCenter />} />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/staff" element={<StaffDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Chatbot />
    </BrowserRouter>
  );
}
