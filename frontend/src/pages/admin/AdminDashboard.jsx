import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
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
  BsPeople,
  BsBriefcase,
  BsBuilding,
  BsFileEarmarkText,
  BsShieldCheck,
  BsCheckCircleFill,
  BsHourglassSplit,
  BsGear,
} from 'react-icons/bs';

const COLORS = ['#0B2545', '#1D4ED8', '#0284C7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  const categoryData = (charts.byCategory || []).slice(0, 7).map((c) => ({
    name: c.name,
    count: parseInt(c.count, 10),
  }));

  const statusData = (charts.byStatus || []).map((s) => ({
    name: s.status,
    count: parseInt(s.count, 10),
  }));

  const monthlyData = (charts.byMonth || []).map((m) => ({
    month: m.month,
    Complaints: parseInt(m.complaints_count, 10),
    FIRs: parseInt(m.firs_count, 10),
  }));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <span className="badge bg-danger text-uppercase fw-bold mb-1">
            System Administration
          </span>
          <h3 className="fw-bold text-navy mb-0" style={{ color: '#0b2545' }}>
            National Portal Analytics &amp; Control
          </h3>
          <p className="text-muted small mb-0">
            Real-time multi-station oversight, FIR monitoring, and departmental performance intelligence.
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link to="/admin/officers" className="btn btn-primary btn-sm fw-semibold">
            Manage Officers
          </Link>
          <Link to="/admin/stations" className="btn btn-outline-primary btn-sm fw-semibold">
            Manage Stations
          </Link>
        </div>
      </div>

      {/* 8-Metric Grid */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-md-3">
          <div className="stat-card primary">
            <div className="stat-label">Total Citizens</div>
            <div className="stat-number">{loading ? '...' : stats.total_citizens || 0}</div>
            <div className="small text-muted mt-1">Registered users</div>
          </div>
        </div>

        <div className="col-sm-6 col-md-3">
          <div className="stat-card info">
            <div className="stat-label">Police Officers</div>
            <div className="stat-number text-info">{loading ? '...' : stats.total_officers || 0}</div>
            <div className="small text-muted mt-1">Duty personnel</div>
          </div>
        </div>

        <div className="col-sm-6 col-md-3">
          <div className="stat-card primary">
            <div className="stat-label">Police Stations</div>
            <div className="stat-number">{loading ? '...' : stats.total_stations || 0}</div>
            <div className="small text-muted mt-1">Jurisdiction centres</div>
          </div>
        </div>

        <div className="col-sm-6 col-md-3">
          <div className="stat-card warning">
            <div className="stat-label">Total Complaints</div>
            <div className="stat-number text-warning">{loading ? '...' : stats.total_complaints || 0}</div>
            <div className="small text-muted mt-1">Portal grievances</div>
          </div>
        </div>

        <div className="col-sm-6 col-md-3">
          <div className="stat-card danger">
            <div className="stat-label">Pending Verification</div>
            <div className="stat-number text-danger">{loading ? '...' : stats.pending_complaints || 0}</div>
            <div className="small text-muted mt-1">Awaiting station review</div>
          </div>
        </div>

        <div className="col-sm-6 col-md-3">
          <div className="stat-card info">
            <div className="stat-label">Registered FIRs</div>
            <div className="stat-number text-primary">{loading ? '...' : stats.total_firs || 0}</div>
            <div className="small text-muted mt-1">Statutory FIR records</div>
          </div>
        </div>

        <div className="col-sm-6 col-md-3">
          <div className="stat-card warning">
            <div className="stat-label">Active Investigations</div>
            <div className="stat-number text-warning">{loading ? '...' : stats.active_investigations || 0}</div>
            <div className="small text-muted mt-1">IO case diaries</div>
          </div>
        </div>

        <div className="col-sm-6 col-md-3">
          <div className="stat-card success">
            <div className="stat-label">Closed / Resolved</div>
            <div className="stat-number text-success">{loading ? '...' : stats.closed_cases || 0}</div>
            <div className="small text-muted mt-1">Concluded matters</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="row g-4 mb-4">
        {/* Monthly Trend Chart */}
        <div className="col-lg-8">
          <div className="gov-card shadow-sm h-100">
            <div className="gov-card-header bg-light">
              <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                Monthly Grievance &amp; FIR Registrations Trend
              </h6>
            </div>
            <div className="gov-card-body p-3">
              {monthlyData.length === 0 ? (
                <div className="text-center py-5 text-muted small">No monthly data</div>
              ) : (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Complaints" fill="#0B2545" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="FIRs" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="col-lg-4">
          <div className="gov-card shadow-sm h-100">
            <div className="gov-card-header bg-light">
              <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                Complaints by Status
              </h6>
            </div>
            <div className="gov-card-body p-3">
              {statusData.length === 0 ? (
                <div className="text-center py-5 text-muted small">No status data</div>
              ) : (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Police Station Workload Table */}
      <div className="gov-card shadow-sm">
        <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
            Police Station Workload &amp; Operational Efficiency
          </h6>
          <Link to="/admin/stations" className="small text-decoration-none">
            Manage All Stations
          </Link>
        </div>

        <div className="gov-card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light text-muted text-uppercase">
                <tr>
                  <th className="ps-4">Station Code</th>
                  <th>Station Name</th>
                  <th>District</th>
                  <th className="text-center">Total Volume</th>
                  <th className="text-center">Pending Check</th>
                  <th className="text-center">Active Cases</th>
                  <th className="text-center">FIRs Recorded</th>
                </tr>
              </thead>
              <tbody>
                {(charts.stationWorkload || []).map((stn) => (
                  <tr key={stn.id}>
                    <td className="ps-4 font-monospace fw-bold text-primary">{stn.station_code}</td>
                    <td className="fw-semibold text-dark">{stn.station_name}</td>
                    <td className="text-muted">{stn.district}</td>
                    <td className="text-center font-monospace fw-bold">{stn.total_complaints}</td>
                    <td className="text-center">
                      <span className="badge bg-warning text-dark font-monospace">
                        {stn.pending}
                      </span>
                    </td>
                    <td className="text-center font-monospace">{stn.active_cases}</td>
                    <td className="text-center">
                      <span className="badge bg-primary font-monospace">
                        {stn.firs_registered}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
