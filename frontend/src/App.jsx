import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import TrackPublic from './pages/public/TrackPublic';
import ForgotPassword from './pages/public/ForgotPassword';

// Citizen Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitComplaint from './pages/citizen/SubmitComplaint';
import MyComplaints from './pages/citizen/MyComplaints';
import ComplaintDetails from './pages/citizen/ComplaintDetails';
import CitizenFIRs from './pages/citizen/CitizenFIRs';
import CitizenProfile from './pages/citizen/CitizenProfile';

// Police Pages
import PoliceDashboard from './pages/police/PoliceDashboard';
import PoliceComplaints from './pages/police/PoliceComplaints';
import PoliceComplaintDetail from './pages/police/PoliceComplaintDetail';
import PoliceVerificationQueue from './pages/police/PoliceVerificationQueue';
import PoliceFIRs from './pages/police/PoliceFIRs';
import InvestigationDetail from './pages/police/InvestigationDetail';
import PoliceReports from './pages/police/PoliceReports';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageOfficers from './pages/admin/ManageOfficers';
import ManageStations from './pages/admin/ManageStations';
import ManageCategories from './pages/admin/ManageCategories';
import AuditLogs from './pages/admin/AuditLogs';
import SystemSettings from './pages/admin/SystemSettings';

// Common
import NotificationsPage from './pages/common/NotificationsPage';
import NotFound from './pages/common/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/track" element={<TrackPublic />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Citizen Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
            <Route path="/dashboard" element={<CitizenDashboard />} />
            <Route path="/complaints/new" element={<SubmitComplaint />} />
            <Route path="/complaints" element={<MyComplaints />} />
            <Route path="/complaints/:id" element={<ComplaintDetails />} />
            <Route path="/firs" element={<CitizenFIRs />} />
          </Route>

          {/* Police Officer Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['police', 'admin']} />}>
            <Route path="/police/dashboard" element={<PoliceDashboard />} />
            <Route path="/police/complaints" element={<PoliceComplaints />} />
            <Route path="/police/complaints/:id" element={<PoliceComplaintDetail />} />
            <Route path="/police/verification" element={<PoliceVerificationQueue />} />
            <Route path="/police/assigned" element={<PoliceComplaints />} />
            <Route path="/police/firs" element={<PoliceFIRs />} />
            <Route path="/police/investigations/:firId" element={<InvestigationDetail />} />
            <Route path="/police/reports" element={<PoliceReports />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/officers" element={<ManageOfficers />} />
            <Route path="/admin/stations" element={<ManageStations />} />
            <Route path="/admin/categories" element={<ManageCategories />} />
            <Route path="/admin/complaints" element={<PoliceComplaints />} />
            <Route path="/admin/firs" element={<PoliceFIRs />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
          </Route>

          {/* Common Protected Routes (Any Authenticated User) */}
          <Route element={<ProtectedRoute allowedRoles={['citizen', 'police', 'admin']} />}>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<CitizenProfile />} />
          </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
