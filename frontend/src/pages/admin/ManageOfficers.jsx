import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import { BsBriefcase, BsPersonPlus, BsSearch, BsShieldCheck } from 'react-icons/bs';

export default function ManageOfficers() {
  const [officers, setOfficers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Officer Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    email: '',
    mobile: '',
    password: 'Password@123',
    rank: 'SI',
    employeeId: '',
    policeStationId: '',
    department: 'Investigation Unit',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOfficers();
    fetchStations();
  }, []);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/officers');
      if (res.data.success) {
        setOfficers(res.data.officers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await api.get('/admin/stations');
      if (res.data.success) {
        setStations(res.data.stations || []);
        if (res.data.stations?.length > 0) {
          setNewOfficer((prev) => ({ ...prev, policeStationId: res.data.stations[0].id }));
        }
      }
    } catch (e) {}
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newOfficer.name || !newOfficer.email || !newOfficer.mobile || !newOfficer.employeeId) {
      toast.warn('Please fill in all mandatory officer fields.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/admin/officers', newOfficer);
      if (res.data.success) {
        toast.success(`Officer ${newOfficer.name} enrolled successfully!`);
        setShowAddModal(false);
        setNewOfficer({
          name: '',
          email: '',
          mobile: '',
          password: 'Password@123',
          rank: 'SI',
          employeeId: '',
          policeStationId: stations[0]?.id || '',
          department: 'Investigation Unit',
        });
        fetchOfficers();
      }
    } catch (err) {
      toast.error(err.message || 'Error creating officer account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
            Police Officers Management
          </h4>
          <p className="text-muted small mb-0">
            Enroll duty officers, assign badge identifiers, and allocate station postings.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary d-flex align-items-center gap-2 fw-semibold shadow-sm"
        >
          <BsPersonPlus className="fs-5" />
          <span>Enroll New Officer</span>
        </button>
      </div>

      {/* Officers List Table */}
      <div className="gov-card shadow-sm">
        <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <BsBriefcase className="text-primary fs-5" />
            <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
              Enrolled Police Officers ({officers.length})
            </h6>
          </div>
        </div>

        <div className="gov-card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="small text-muted mt-2">Loading officer rosters...</div>
            </div>
          ) : officers.length === 0 ? (
            <div className="text-center py-5 text-muted small">No officers recorded.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light text-muted text-uppercase">
                  <tr>
                    <th className="ps-4">Badge / Employee ID</th>
                    <th>Officer Name</th>
                    <th>Rank</th>
                    <th>Assigned Police Station</th>
                    <th>Department</th>
                    <th>Email &amp; Mobile</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map((o) => (
                    <tr key={o.id}>
                      <td className="ps-4 font-monospace fw-bold text-primary">
                        {o.employee_id}
                      </td>
                      <td className="fw-semibold text-dark">{o.name}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-primary border">
                          {o.rank}
                        </span>
                      </td>
                      <td className="fw-semibold text-secondary">
                        {o.station_name ? `${o.station_name} (${o.station_code})` : 'Unassigned'}
                      </td>
                      <td className="text-muted">{o.department}</td>
                      <td>
                        <div className="text-dark">{o.email}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{o.mobile}</div>
                      </td>
                      <td>
                        <span className="badge bg-success">{o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Enroll Officer Modal */}
      {showAddModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-navy text-white" style={{ backgroundColor: '#0b2545' }}>
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <BsPersonPlus className="text-warning" />
                  <span>Enroll Duty Police Officer</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)} />
              </div>

              <form onSubmit={handleAddSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">
                        Officer Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Inspector Amit Verma"
                        value={newOfficer.name}
                        onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">
                        Badge / Employee ID <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. POL-DL-7788"
                        value={newOfficer.employeeId}
                        onChange={(e) => setNewOfficer({ ...newOfficer, employeeId: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">
                        Official Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. amit.verma@police.gov.in"
                        value={newOfficer.email}
                        onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">
                        Contact Mobile <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="e.g. 9811009988"
                        value={newOfficer.mobile}
                        onChange={(e) => setNewOfficer({ ...newOfficer, mobile: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">
                        Rank Designation <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={newOfficer.rank}
                        onChange={(e) => setNewOfficer({ ...newOfficer, rank: e.target.value })}
                      >
                        <option value="Constable">Constable</option>
                        <option value="Head Constable">Head Constable</option>
                        <option value="ASI">Assistant Sub-Inspector (ASI)</option>
                        <option value="SI">Sub-Inspector (SI)</option>
                        <option value="Inspector">Police Inspector</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">
                        Station Posting <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={newOfficer.policeStationId}
                        onChange={(e) => setNewOfficer({ ...newOfficer, policeStationId: e.target.value })}
                        required
                      >
                        {stations.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.station_name} ({s.station_code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">Department Unit</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Cyber Forensics / Special Crime"
                        value={newOfficer.department}
                        onChange={(e) => setNewOfficer({ ...newOfficer, department: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-secondary">Initial Account Password</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={newOfficer.password}
                        onChange={(e) => setNewOfficer({ ...newOfficer, password: e.target.value })}
                      />
                      <div className="form-text small">Officer can change this password after initial login.</div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm fw-bold px-4"
                    disabled={saving}
                  >
                    {saving ? 'Enrolling...' : 'Enroll Officer Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
