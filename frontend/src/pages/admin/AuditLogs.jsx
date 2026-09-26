import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { BsJournalText, BsSearch, BsFilter, BsShieldCheck } from 'react-icons/bs';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [action, entityType, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (action) params.append('action', action);
      if (entityType) params.append('entityType', entityType);
      params.append('page', page);
      params.append('limit', 20);

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.logs || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
          System Security &amp; Audit Logs
        </h4>
        <p className="text-muted small mb-0">
          Immutable forensic audit trail of all electronic activities, legal actions, status transitions, and user logins.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="gov-card p-3 shadow-sm mb-4">
        <div className="row g-2">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light text-muted">
                <BsSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by action keyword (e.g. LOGIN, VERIFY, REGISTER)..."
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="col-md-4">
            <select
              className="form-select"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Entity Types</option>
              <option value="users">Users / Citizens</option>
              <option value="complaints">Complaints</option>
              <option value="firs">First Information Reports (FIR)</option>
              <option value="investigation_updates">Investigation Updates</option>
              <option value="police_stations">Police Stations</option>
              <option value="feedback">Feedback</option>
            </select>
          </div>

          <div className="col-md-3">
            <button
              onClick={() => {
                setAction('');
                setEntityType('');
                setPage(1);
              }}
              className="btn btn-outline-secondary w-100"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="gov-card shadow-sm">
        <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <BsJournalText className="text-primary fs-5" />
            <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
              Forensic Audit Entries ({total})
            </h6>
          </div>
          <span className="badge bg-secondary-subtle text-primary border">Page {page} of {totalPages}</span>
        </div>

        <div className="gov-card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="small text-muted mt-2">Loading audit logs...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5 text-muted small">No audit records found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small" style={{ fontSize: '0.8rem' }}>
                <thead className="table-light text-muted text-uppercase">
                  <tr>
                    <th className="ps-4">Timestamp</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Entity ID</th>
                    <th>Actor / User</th>
                    <th>Details / New Value</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="ps-4 text-muted font-monospace" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border font-monospace">
                          {log.action}
                        </span>
                      </td>
                      <td className="text-secondary fw-semibold">{log.entity_type}</td>
                      <td className="font-monospace text-primary">{log.entity_id || '—'}</td>
                      <td>
                        {log.user_name ? (
                          <div>
                            <span className="fw-semibold text-dark">{log.user_name}</span>
                            <span className="badge bg-light text-muted ms-1" style={{ fontSize: '0.65rem' }}>
                              {log.user_role}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted fst-italic">System / Anonymous</span>
                        )}
                      </td>
                      <td className="text-muted text-truncate" style={{ maxWidth: '280px' }}>
                        {log.new_value || log.old_value || '—'}
                      </td>
                      <td className="font-monospace text-muted" style={{ fontSize: '0.72rem' }}>
                        {log.ip_address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
