import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { BsShieldCheck, BsFolder2Open, BsSearch, BsEye } from 'react-icons/bs';

export default function PoliceFIRs() {
  const [firs, setFirs] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFIRs();
  }, [status]);

  const fetchFIRs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (search) params.append('search', search);

      const res = await api.get(`/firs?${params.toString()}`);
      if (res.data.success) {
        setFirs(res.data.firs || []);
        setTotal(res.data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFIRs();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
            First Information Report (FIR) Repository
          </h4>
          <p className="text-muted small mb-0">
            Station jurisdictional records of all statutory FIRs and active criminal investigations.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="gov-card p-3 shadow-sm mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light text-muted">
                <BsSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search FIR #, legal sections, or complainant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All FIR Statuses</option>
              <option value="Registered">Registered</option>
              <option value="Assigned">Assigned</option>
              <option value="Investigation Started">Investigation Started</option>
              <option value="Evidence Collection">Evidence Collection</option>
              <option value="Verification">Verification</option>
              <option value="Further Action">Further Action</option>
              <option value="Completed">Completed</option>
              <option value="Chargesheet Filed">Chargesheet Filed</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-fill">
              Filter
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatus('');
              }}
              className="btn btn-outline-secondary"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* FIRs Table */}
      <div className="gov-card shadow-sm">
        <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <BsShieldCheck className="text-primary fs-5" />
            <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
              Station FIR Registry ({firs.length})
            </h6>
          </div>
        </div>

        <div className="gov-card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="small text-muted mt-2">Loading FIR records...</div>
            </div>
          ) : firs.length === 0 ? (
            <div className="text-center py-5">
              <div className="fs-1 text-muted mb-2">🛡️</div>
              <h6 className="fw-bold text-secondary">No FIR Records Found</h6>
              <p className="small text-muted mb-0">No FIR records match the search criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light text-muted text-uppercase">
                  <tr>
                    <th className="ps-4">FIR Number</th>
                    <th>Complainant</th>
                    <th>Station</th>
                    <th>Sections / Acts</th>
                    <th>Registration Date</th>
                    <th>Investigating Officer</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {firs.map((f) => (
                    <tr key={f.id}>
                      <td className="ps-4 font-monospace fw-bold text-primary fs-6">
                        {f.fir_number}
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{f.citizen_name}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          Ref: {f.complaint_number}
                        </div>
                      </td>
                      <td className="fw-semibold text-secondary">{f.station_name}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-dark border">
                          {f.sections}
                        </span>
                      </td>
                      <td className="text-muted">{new Date(f.registration_date).toLocaleDateString()}</td>
                      <td>
                        {f.io_name ? (
                          `${f.io_rank} ${f.io_name}`
                        ) : (
                          <span className="text-muted fst-italic">Pending IO</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={f.status} />
                      </td>
                      <td className="text-end pe-4">
                        <Link
                          to={`/police/investigations/${f.id}`}
                          className="btn btn-dark btn-sm d-inline-flex align-items-center gap-1 shadow-sm"
                        >
                          <BsFolder2Open />
                          <span>Investigation Diary</span>
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
