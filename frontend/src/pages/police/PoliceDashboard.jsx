import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BsShieldCheck,
  BsHourglassSplit,
  BsCheck2Square,
  BsFolder2Open,
  BsCheckCircleFill,
  BsEye,
  BsArrowRight,
  BsBuilding,
} from 'react-icons/bs';

const COLORS = ['#0B2545', '#1D4ED8', '#0284C7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function PoliceDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, compRes] = await Promise.all([
        api.get('/police/dashboard'),
        api.get('/complaints?limit=6'),
      ]);

      if (dashRes.data.success) {
        setStats(dashRes.data.stats);
      }
      if (compRes.data.success) {
        setRecentComplaints(compRes.data.complaints || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (st) => {
    if (!stats?.byStatus) return 0;
    const item = stats.byStatus.find((x) => x.status === st);
    return item ? parseInt(item.count, 10) : 0;
  };

  const pendingVerification =
    getStatusCount('Submitted') + getStatusCount('Under Verification');
  const infoRequested = getStatusCount('Information Required');
  const acceptedCount = getStatusCount('Accepted');
  const activeInvestigations =
    getStatusCount('FIR Registered') +
    getStatusCount('Assigned') +
    getStatusCount('Under Investigation');
  const resolvedCases = getStatusCount('Resolved') + getStatusCount('Closed');

  // Chart data formatting
  const categoryData = (stats?.byCategory || []).slice(0, 6).map((c) => ({
    name: c.name,
    count: parseInt(c.count, 10),
  }));

  const monthlyData = (stats?.monthlyStats || []).map((m) => ({
    month: m.month,
    complaints: parseInt(m.total_complaints, 10),
    firs: parseInt(m.fir_cases || 0, 10),
    resolved: parseInt(m.resolved_cases || 0, 10),
  }));

  return (
    <div>
      {/* Top Station Header */}
      <div className="gov-card p-4 bg-navy text-white shadow-sm mb-4" style={{ backgroundColor: '#0b2545' }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-warning text-dark text-uppercase fw-bold">
                Duty Officer Portal
              </span>
              <span className="text-light opacity-75 small">
                Badge: {user?.employeeId || 'OFFICER'} | {user?.rank}
              </span>
            </div>
            <h3 className="fw-bold mb-1">Inspector Station Dashboard</h3>
            <p className="text-light opacity-90 small mb-0 d-flex align-items-center gap-1">
              <BsBuilding />
              <span>
                {user?.policeStationName || 'Central Jurisdiction Police Station'} (
                {user?.policeStationCode || 'STN-DL-001'})
              </span>
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link to="/police/verification" className="btn btn-warning fw-bold px-3 py-2 shadow">
              Verification Queue ({pendingVerification})
            </Link>
            <Link to="/police/firs" className="btn btn-outline-light px-3 py-2">
              FIR Records ({stats?.totalFIRs || 0})
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card warning">
            <div className="stat-label">Pending Verification</div>
            <div className="stat-number text-warning">{pendingVerification}</div>
            <div className="small text-muted mt-1">Requires officer action</div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="stat-card primary">
            <div className="stat-label">Accepted Complaints</div>
            <div className="stat-number">{acceptedCount}</div>
            <div className="small text-muted mt-1">Ready for FIR registration</div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="stat-card info">
            <div className="stat-label">Active Investigations</div>
            <div className="stat-number text-info">{activeInvestigations}</div>
            <div className="small text-muted mt-1">Case diary in progress</div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="stat-card success">
            <div className="stat-label">Resolved / Concluded</div>
            <div className="stat-number text-success">{resolvedCases}</div>
            <div className="small text-muted mt-1">Final reports filed</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="row g-4 mb-4">
        {/* Monthly Complaint Statistics */}
        <div className="col-lg-7">
          <div className="gov-card shadow-sm h-100">
            <div className="gov-card-header bg-light">
              <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                Monthly Grievance &amp; FIR Trends
              </h6>
            </div>
            <div className="gov-card-body p-3">
              {monthlyData.length === 0 ? (
                <div className="text-center py-5 text-muted small">No monthly data available yet</div>
              ) : (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="complaints" name="Complaints" fill="#0B2545" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="firs" name="FIRs Registered" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolved" name="Resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Complaints by Category Breakdown */}
        <div className="col-lg-5">
          <div className="gov-card shadow-sm h-100">
            <div className="gov-card-header bg-light">
              <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                Complaints by Category
              </h6>
            </div>
            <div className="gov-card-body p-3">
              {categoryData.length === 0 ? (
                <div className="text-center py-5 text-muted small">No category statistics</div>
              ) : (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Station Complaints Queue */}
      <div className="gov-card shadow-sm">
        <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <BsFolder2Open className="text-primary fs-5" />
            <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
              Station Verification &amp; Action Queue
            </h6>
          </div>
          <Link to="/police/complaints" className="small text-decoration-none fw-semibold d-flex align-items-center gap-1">
            <span>View All ({stats?.byStatus?.reduce((acc, c) => acc + parseInt(c.count, 10), 0) || 0})</span>
            <BsArrowRight />
          </Link>
        </div>

        <div className="gov-card-body p-0">
          {recentComplaints.length === 0 ? (
            <div className="text-center py-5 text-muted small">No complaints in station queue.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light text-muted text-uppercase">
                  <tr>
                    <th className="ps-4">Reference Number</th>
                    <th>Complainant</th>
                    <th>Category</th>
                    <th>Incident Date</th>
                    <th>Current Status</th>
                    <th>Officer</th>
                    <th className="text-end pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map((c) => (
                    <tr key={c.id}>
                      <td className="ps-4 font-monospace fw-bold text-primary">
                        <Link to={`/police/complaints/${c.id}`} className="text-decoration-none">
                          {c.complaint_number}
                        </Link>
                      </td>
                      <td className="fw-semibold text-dark">{c.citizen_name}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {c.category_name}
                        </span>
                      </td>
                      <td className="text-muted">{c.incident_date}</td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="text-muted">
                        {c.assigned_officer_name ? (
                          `${c.assigned_officer_rank} ${c.assigned_officer_name}`
                        ) : (
                          <span className="text-muted fst-italic">Unassigned</span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <Link
                          to={`/police/complaints/${c.id}`}
                          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                        >
                          <BsEye />
                          <span>Review &amp; Verify</span>
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
