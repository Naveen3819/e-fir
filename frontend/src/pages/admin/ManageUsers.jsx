import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import { BsPeople, BsSearch, BsFilter, BsShieldCheck, BsSlashCircle, BsCheckCircle } from 'react-icons/bs';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [role, status, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      params.append('page', page);
      params.append('limit', 15);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.users || []);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to change ${user.name}'s account status to ${nextStatus}?`)) {
      return;
    }

    try {
      const res = await api.put(`/admin/users/${user.id}/status`, { status: nextStatus });
      if (res.data.success) {
        toast.success(`User status changed to ${nextStatus}.`);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Error updating user status.');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
          User &amp; Citizen Accounts Management
        </h4>
        <p className="text-muted small mb-0">
          Supervise citizen accounts, view registration metadata, and enforce account suspensions when required.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="gov-card p-3 shadow-sm mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light text-muted">
                <BsSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email, or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    fetchUsers();
                  }
                }}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Account Roles</option>
              <option value="citizen">Citizens</option>
              <option value="police">Police Personnel</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="col-md-2">
            <select
              className="form-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="col-md-2">
            <button
              onClick={() => {
                setPage(1);
                fetchUsers();
              }}
              className="btn btn-primary w-100"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="gov-card shadow-sm">
        <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
            Registered Users ({total})
          </h6>
          <span className="badge bg-secondary-subtle text-primary border">Page {page} of {totalPages}</span>
        </div>

        <div className="gov-card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="small text-muted mt-2">Loading user accounts...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5 text-muted small">No users found matching query.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light text-muted text-uppercase">
                  <tr>
                    <th className="ps-4">Full Name</th>
                    <th>Email Address</th>
                    <th>Mobile</th>
                    <th>Role</th>
                    <th>City / State</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th className="text-end pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="ps-4 fw-semibold text-dark">{u.name}</td>
                      <td className="text-muted">{u.email}</td>
                      <td className="text-muted">{u.mobile}</td>
                      <td>
                        <span
                          className={`badge text-uppercase ${
                            u.role === 'admin'
                              ? 'bg-danger'
                              : u.role === 'police'
                              ? 'bg-primary'
                              : 'bg-secondary'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="text-muted">
                        {[u.city, u.state].filter(Boolean).join(', ') || 'N/A'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.status === 'active' ? 'bg-success' : 'bg-danger'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="text-end pe-4">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`btn btn-sm ${
                              u.status === 'active'
                                ? 'btn-outline-danger'
                                : 'btn-outline-success'
                            }`}
                            title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
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
