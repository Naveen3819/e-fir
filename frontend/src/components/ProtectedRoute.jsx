import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading Portal...</span>
        </div>
        <div className="fw-bold text-navy" style={{ color: '#0b2545' }}>E-FIR MANAGEMENT SYSTEM</div>
        <div className="small text-muted">Authenticating credentials...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If citizen tries to go to police/admin or vice-versa, redirect to their home
    if (role === 'citizen') return <Navigate to="/dashboard" replace />;
    if (role === 'police') return <Navigate to="/police/dashboard" replace />;
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
