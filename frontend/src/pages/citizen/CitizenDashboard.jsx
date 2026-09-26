import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import {
  BsFileEarmarkPlus,
  BsCardList,
  BsHourglassSplit,
  BsShieldCheck,
  BsCheckCircleFill,
  BsExclamationTriangleFill,
  BsEye,
  BsArrowRight,
} from 'react-icons/bs';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints?limit=10');
      if (res.data.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Compute metrics
  const total = complaints.length;
  const pending = complaints.filter((c) =>
    ['Submitted', 'Under Verification'].includes(c.status)
  ).length;
  const infoRequired = complaints.filter(
    (c) => c.status === 'Information Required'
  ).length;
  const firRegistered = complaints.filter((c) =>
    ['FIR Registered', 'Assigned', 'Under Investigation'].includes(c.status)
  ).length;
  const resolved = complaints.filter((c) =>
    ['Resolved', 'Closed'].includes(c.status)
  ).length;

  return (
    <div>
      {/* Top Welcome Banner */}
      <div className="gov-card p-4 bg-navy text-white shadow-sm mb-4" style={{ backgroundColor: '#0b2545' }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <span className="badge bg-warning text-dark text-uppercase fw-bold mb-2">
              Citizen Portal
            </span>
            <h3 className="fw-bold mb-1">Welcome back, {user?.name}!</h3>
            <p className="text-light opacity-90 small mb-0">
              National Electronic First Information Report &amp; Grievance Management Dashboard
            </p>
          </div>
          <div>
            <Link
              to="/complaints/new"
              className="btn btn-warning fw-bold px-3 py-2 d-flex align-items-center gap-2 shadow"
            >
              <BsFileEarmarkPlus className="fs-5" />
              <span>Submit New Grievance / E-FIR</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Info Required Alert Banner if police requested info */}
      {infoRequired > 0 && (
        <div className="alert alert-warning border border-warning d-flex align-items-center justify-content-between mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <BsExclamationTriangleFill className="fs-4 text-warning" />
            <div>
              <strong>Action Required:</strong> The investigating officer has requested additional documents/information for {infoRequired} of your complaints.
            </div>
          </div>
          <Link to="/complaints?status=Information Required" className="btn btn-sm btn-dark">
            View Requests
          </Link>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card primary">
            <div className="stat-label">Total Grievances</div>
            <div className="stat-number">{loading ? '...' : total}</div>
            <div className="small text-muted mt-1">Submitted on portal</div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="stat-card warning">
            <div className="stat-label">Pending Verification</div>
            <div className="stat-number text-warning">{loading ? '...' : pending}</div>
            <div className="small text-muted mt-1">Awaiting station check</div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="stat-card info">
            <div className="stat-label">FIRs &amp; Investigation</div>
            <div className="stat-number text-info">{loading ? '...' : firRegistered}</div>
            <div className="small text-muted mt-1">Legally registered cases</div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="stat-card success">
            <div className="stat-label">Resolved Cases</div>
            <div className="stat-number text-success">{loading ? '...' : resolved}</div>
            <div className="small text-muted mt-1">Successfully concluded</div>
          </div>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="gov-card shadow-sm">
        <div className="gov-card-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <BsCardList className="text-primary fs-5" />
            <h5 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
              My Recent Complaints
            </h5>
          </div>
          <Link to="/complaints" className="small text-decoration-none fw-semibold d-flex align-items-center gap-1">
            <span>View All</span>
            <BsArrowRight />
          </Link>
        </div>

        <div className="gov-card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="small text-muted mt-2">Loading complaints...</div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-5 px-3">
              <div className="fs-1 text-muted mb-2">📁</div>
              <h6 className="fw-bold text-secondary">No Complaints Submitted Yet</h6>
              <p className="small text-muted mb-3">
                You have not filed any grievances or E-FIR requests on this portal.
              </p>
              <Link to="/complaints/new" className="btn btn-primary btn-sm">
                Submit Your First Complaint
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th className="ps-4">Complaint ID</th>
                    <th>Category</th>
                    <th>Police Station</th>
                    <th>Incident Date</th>
                    <th>Status</th>
                    <th>Assigned Officer</th>
                    <th className="text-end pe-4">Action</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {complaints.map((c) => (
                    <tr key={c.id}>
                      <td className="ps-4 font-monospace fw-bold text-primary">
                        <Link to={`/complaints/${c.id}`} className="text-decoration-none">
                          {c.complaint_number}
                        </Link>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {c.category_name}
                        </span>
                      </td>
                      <td className="fw-semibold text-secondary">{c.station_name}</td>
                      <td className="text-muted">{c.incident_date}</td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="text-muted">
                        {c.assigned_officer_name ? (
                          <span>
                            {c.assigned_officer_rank} {c.assigned_officer_name}
                          </span>
                        ) : (
                          <span className="text-muted fst-italic">Pending assignment</span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                        >
                          <BsEye />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
