import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BsSpeedometer2,
  BsFileEarmarkPlus,
  BsCardList,
  BsShieldCheck,
  BsBell,
  BsPerson,
  BsSearch,
  BsCheck2Square,
  BsBriefcase,
  BsFolder2Open,
  BsBarChart,
  BsPeople,
  BsBuilding,
  BsTag,
  BsJournalText,
  BsGear,
} from 'react-icons/bs';

export default function Sidebar() {
  const { user, role } = useAuth();

  const citizenLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <BsSpeedometer2 /> },
    { to: '/complaints/new', label: 'Submit Complaint', icon: <BsFileEarmarkPlus /> },
    { to: '/complaints', label: 'My Complaints', icon: <BsCardList /> },
    { to: '/firs', label: 'Registered FIRs', icon: <BsShieldCheck /> },
    { to: '/track', label: 'Track Status', icon: <BsSearch /> },
    { to: '/notifications', label: 'Notifications', icon: <BsBell /> },
    { to: '/profile', label: 'My Profile', icon: <BsPerson /> },
  ];

  const policeLinks = [
    { to: '/police/dashboard', label: 'Station Dashboard', icon: <BsSpeedometer2 /> },
    { to: '/police/complaints', label: 'Complaints Queue', icon: <BsCardList /> },
    { to: '/police/verification', label: 'Verification Queue', icon: <BsCheck2Square /> },
    { to: '/police/assigned', label: 'Assigned Cases', icon: <BsBriefcase /> },
    { to: '/police/firs', label: 'FIR Management', icon: <BsShieldCheck /> },
    { to: '/police/investigations', label: 'Active Investigations', icon: <BsFolder2Open /> },
    { to: '/police/reports', label: 'Station Reports', icon: <BsBarChart /> },
    { to: '/profile', label: 'Officer Profile', icon: <BsPerson /> },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'System Overview', icon: <BsSpeedometer2 /> },
    { to: '/admin/users', label: 'Citizens & Users', icon: <BsPeople /> },
    { to: '/admin/officers', label: 'Police Officers', icon: <BsBriefcase /> },
    { to: '/admin/stations', label: 'Police Stations', icon: <BsBuilding /> },
    { to: '/admin/categories', label: 'Complaint Categories', icon: <BsTag /> },
    { to: '/admin/complaints', label: 'All Complaints', icon: <BsCardList /> },
    { to: '/admin/firs', label: 'All FIRs', icon: <BsShieldCheck /> },
    { to: '/admin/audit-logs', label: 'System Audit Logs', icon: <BsJournalText /> },
    { to: '/admin/settings', label: 'Portal Settings', icon: <BsGear /> },
  ];

  let links = [];
  if (role === 'citizen') links = citizenLinks;
  else if (role === 'police') links = policeLinks;
  else if (role === 'admin') links = adminLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="small text-muted text-uppercase fw-bold">Active Role</span>
          <span className="sidebar-role-badge">{role} portal</span>
        </div>
        <div className="fw-bold text-white small text-truncate">{user?.name}</div>
        {user?.policeStationName && (
          <div className="text-warning small text-truncate" style={{ fontSize: '0.75rem' }}>
            🏢 {user?.policeStationName}
          </div>
        )}
      </div>

      <ul className="sidebar-menu">
        {links.map((link) => (
          <li key={link.to} className="sidebar-item">
            <NavLink
              to={link.to}
              end={link.to === '/dashboard' || link.to === '/police/dashboard' || link.to === '/admin/dashboard'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="fs-5">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="p-3 border-top border-secondary border-opacity-25 small text-center text-muted">
        <div>E-FIR Portal v1.0.0</div>
        <div style={{ fontSize: '0.7rem' }}>Authorized Official Use</div>
      </div>
    </aside>
  );
}
