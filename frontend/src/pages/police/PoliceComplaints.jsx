import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { BsSearch, BsFilter, BsEye, BsShieldCheck } from 'react-icons/bs';

export default function PoliceComplaints() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchComplaints();
  }, [status, page]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      params.append('page', page);
      params.append('limit', 15);

      const res = await api.get(`/complaints?${params.toString()}`);
      if (res.data.success) {
        setComplaints(res.data.complaints || []);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const statusOptions = [
    'All Statuses',
    'Submitted',
    'Under Verification',
    'Information Required',
    'Accepted',
    'FIR Registered',
    'Assigned',
    'Under Investigation',
    'Resolved',
    'Closed',
    'Rejected',
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
            Police Station Grievance Queue
          </h4>
          <p className="text-muted small mb-0">
            Review, verify, request citizen information, or register First Information Reports (FIRs).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="gov-card p-3 shadow-sm mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light text-muted">
                <BsSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search reference #, complainant name, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light text-muted">
                <BsFilter />
              </span>
              <select
                className="form-select"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value === 'All Statuses' ? '' : e.target.value);
                  setPage(1);
                }}
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt === 'All Statuses' ? '' : opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-md-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-fill">
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatus('');
                setPage(1);
              }}
              className="btn btn-outline-secondary"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Complaints Table */}
      <div className="gov-card shadow-sm">
        <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
            Complaints in Station Jurisdiction ({total})
          </h6>
          <span className="badge bg-secondary-subtle text-primary border">Page {page} of {totalPages}</span>
        </div>

        <div className="gov-card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="small text-muted mt-2">Loading complaints...</div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-5">
              <div className="fs-1 text-muted mb-2">📁</div>
              <h6 className="fw-bold text-secondary">No Complaints Found</h6>
              <p className="small text-muted mb-0">No records match the selected filter criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light text-muted text-uppercase">
                  <tr>
                    <th className="ps-4">Reference Number</th>
                    <th>Complainant</th>
                    <th>Category</th>
                    <th>Incident Date</th>
                    <th>Status</th>
                    <th>Assigned IO</th>
                    <th className="text-end pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id}>
                      <td className="ps-4 font-monospace fw-bold text-primary">
                        <Link to={`/police/complaints/${c.id}`} className="text-decoration-none">
                          {c.complaint_number}
                        </Link>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{c.citizen_name}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{c.citizen_mobile}</div>
                      </td>
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
                          <span>Review</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-top d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
