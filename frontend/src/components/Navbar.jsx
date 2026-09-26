import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  BsBell,
  BsShieldCheck,
  BsPersonCircle,
  BsBoxArrowRight,
  BsTelephoneFill,
  BsExclamationTriangleFill,
  BsPeopleFill,
  BsBuilding,
  BsFileEarmarkText,
} from 'react-icons/bs';

export default function Navbar() {
  const { user, isAuthenticated, role, logout, quickSwitchDemo } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 25000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications.slice(0, 5));
        setUnreadCount(res.data.unreadCount);
      }
    } catch (e) {}
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await api.put(`/notifications/${notif.id}/read`);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setShowNotifMenu(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (e) {}
  };

  return (
    <header className="sticky-top shadow-sm" style={{ zIndex: 1030 }}>
      {/* 1. Indian Tricolor Accent Ribbon */}
      <div className="gov-ribbon"></div>

      {/* 2. Top Emergency & Citizen Hotline Bar */}
      <div className="top-gov-bar">
        <div className="container-fluid px-3 px-md-4 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <span className="d-none d-md-inline text-warning fw-semibold">
              Emergency Police Assistance:
            </span>
            <span className="badge bg-danger d-inline-flex align-items-center gap-1">
              <BsTelephoneFill /> 112 (All Emergency)
            </span>
            <span className="badge bg-primary d-none d-sm-inline-flex align-items-center gap-1">
              <BsShieldCheck /> 1930 (Cyber Crime)
            </span>
          </div>

          {/* Quick Demo Switcher Bar for Reviewer */}
          <div className="d-flex align-items-center gap-2">
            <span className="d-none d-lg-inline small text-light opacity-75">
              Quick Role Switcher:
            </span>
            <div className="btn-group btn-group-sm">
              <button
                onClick={() => quickSwitchDemo('citizen')}
                className={`btn btn-xs ${role === 'citizen' ? 'btn-warning text-dark fw-bold' : 'btn-outline-light text-light'}`}
                style={{ fontSize: '0.72rem', padding: '1px 8px' }}
                title="Switch to Demo Citizen (Rahul Deshmukh)"
              >
                Citizen
              </button>
              <button
                onClick={() => quickSwitchDemo('police')}
                className={`btn btn-xs ${role === 'police' ? 'btn-info text-dark fw-bold' : 'btn-outline-light text-light'}`}
                style={{ fontSize: '0.72rem', padding: '1px 8px' }}
                title="Switch to Demo Police Officer (Inspector Vikram Rathore)"
              >
                Police
              </button>
              <button
                onClick={() => quickSwitchDemo('admin')}
                className={`btn btn-xs ${role === 'admin' ? 'btn-danger fw-bold' : 'btn-outline-light text-light'}`}
                style={{ fontSize: '0.72rem', padding: '1px 8px' }}
                title="Switch to Demo Admin (Rajesh Sharma)"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Government Header Navigation */}
      <nav className="portal-header">
        <div className="container-fluid px-3 px-md-4 d-flex justify-content-between align-items-center">
          <Link to="/" className="text-decoration-none d-flex align-items-center gap-3">
            <div
              className="rounded-circle bg-white d-flex align-items-center justify-content-center text-primary shadow-sm"
              style={{ width: '42px', height: '42px', fontSize: '1.4rem' }}
            >
              🛡️
            </div>
            <div>
              <h1 className="portal-brand-title">E-FIR MANAGEMENT SYSTEM</h1>
              <p className="portal-brand-subtitle">
                National Citizen–Police Electronic Portal &amp; Investigation Tracking
              </p>
            </div>
          </Link>

          {/* Right Navigation & Profile */}
          <div className="d-flex align-items-center gap-2">
            <Link to="/track" className="btn btn-outline-light btn-sm d-none d-md-inline-flex align-items-center gap-1 me-2">
              <BsFileEarmarkText />
              <span>Track Complaint</span>
            </Link>

            {isAuthenticated ? (
              <>
                {/* Notifications Bell Dropdown */}
                <div className="position-relative me-2">
                  <button
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="btn btn-outline-light btn-sm position-relative rounded-circle p-2"
                    style={{ width: '38px', height: '38px' }}
                    aria-label="Notifications"
                  >
                    <BsBell className="fs-5" />
                    {unreadCount > 0 && (
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light"
                        style={{ fontSize: '0.65rem' }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Menu */}
                  {showNotifMenu && (
                    <div
                      className="dropdown-menu dropdown-menu-end show shadow-lg p-0 mt-2 border-0"
                      style={{
                        position: 'absolute',
                        right: 0,
                        width: '320px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        zIndex: 1050,
                      }}
                    >
                      <div className="p-3 bg-navy text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0b2545' }}>
                        <span className="fw-bold small">Notifications</span>
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifMenu(false)}
                          className="text-warning small text-decoration-none"
                        >
                          View All
                        </Link>
                      </div>

                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div className="p-3 text-center text-muted small">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-2 border-bottom cursor-pointer ${
                                !n.is_read ? 'bg-light fw-semibold' : ''
                              }`}
                              style={{ cursor: 'pointer', fontSize: '0.82rem' }}
                            >
                              <div className="text-dark mb-1">{n.message}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {new Date(n.created_at).toLocaleString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info & Role Badge */}
                <div className="dropdown">
                  <button
                    className="btn btn-dark btn-sm d-flex align-items-center gap-2 border border-secondary"
                    data-bs-toggle="dropdown"
                    id="userDropdown"
                  >
                    <BsPersonCircle className="fs-5 text-warning" />
                    <div className="text-start d-none d-sm-block" style={{ lineHeight: '1.1' }}>
                      <div className="small fw-bold text-white">{user?.name}</div>
                      <span className="badge bg-warning text-dark text-uppercase" style={{ fontSize: '0.62rem' }}>
                        {user?.role}
                      </span>
                    </div>
                  </button>

                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                    <li className="px-3 py-2 border-bottom">
                      <div className="fw-bold text-dark small">{user?.name}</div>
                      <div className="text-muted small">{user?.email}</div>
                      {user?.rank && (
                        <div className="small text-primary fw-semibold mt-1">
                          {user?.rank} | Badge: {user?.employeeId}
                        </div>
                      )}
                    </li>
                    <li>
                      <Link className="dropdown-item small" to="/profile">
                        My Profile
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item small" to="/notifications">
                        Notifications ({unreadCount})
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button onClick={logout} className="dropdown-item small text-danger d-flex align-items-center gap-2">
                        <BsBoxArrowRight /> Log Out
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-outline-light btn-sm">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-warning btn-sm fw-bold">
                  Citizen Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
