import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import { BsBuilding, BsPlusCircle, BsTelephoneFill, BsEnvelopeFill } from 'react-icons/bs';

export default function ManageStations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [formData, setFormData] = useState({
    stationName: '',
    stationCode: '',
    address: '',
    district: '',
    state: '',
    contactNumber: '',
    email: '',
    jurisdictionPincodes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stations');
      if (res.data.success) {
        setStations(res.data.stations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStation(null);
    setFormData({
      stationName: '',
      stationCode: '',
      address: '',
      district: '',
      state: '',
      contactNumber: '',
      email: '',
      jurisdictionPincodes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (stn) => {
    setEditingStation(stn);
    setFormData({
      stationName: stn.station_name,
      stationCode: stn.station_code,
      address: stn.address,
      district: stn.district,
      state: stn.state,
      contactNumber: stn.contact_number,
      email: stn.email || '',
      jurisdictionPincodes: stn.jurisdiction_pincodes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingStation) {
        const res = await api.put(`/admin/stations/${editingStation.id}`, formData);
        if (res.data.success) {
          toast.success('Station updated successfully.');
          setShowModal(false);
          fetchStations();
        }
      } else {
        const res = await api.post('/admin/stations', formData);
        if (res.data.success) {
          toast.success('Police Station added successfully.');
          setShowModal(false);
          fetchStations();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Error saving station');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
            Police Station Registry
          </h4>
          <p className="text-muted small mb-0">
            Define jurisdictional boundaries, station codes, pincode coverages, and contact helplines.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn btn-primary d-flex align-items-center gap-2 fw-semibold shadow-sm"
        >
          <BsPlusCircle />
          <span>Add Police Station</span>
        </button>
      </div>

      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <div className="small text-muted mt-2">Loading police station directory...</div>
          </div>
        ) : stations.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted small">No stations found.</div>
        ) : (
          stations.map((stn) => (
            <div key={stn.id} className="col-md-6 col-lg-4">
              <div className="gov-card shadow-sm h-100 position-relative">
                <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
                  <span className="badge bg-secondary-subtle text-primary border font-monospace">
                    {stn.station_code}
                  </span>
                  <span className={`badge ${stn.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                    {stn.status}
                  </span>
                </div>

                <div className="gov-card-body p-4 small">
                  <h5 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
                    {stn.station_name}
                  </h5>
                  <p className="text-muted mb-2">{stn.district}, {stn.state}</p>
                  <p className="text-dark small mb-3">{stn.address}</p>

                  <div className="mb-2 d-flex align-items-center gap-2">
                    <BsTelephoneFill className="text-primary" />
                    <span className="fw-bold text-dark">{stn.contact_number}</span>
                  </div>

                  {stn.email && (
                    <div className="mb-3 d-flex align-items-center gap-2 text-muted">
                      <BsEnvelopeFill className="text-secondary" />
                      <span className="text-truncate">{stn.email}</span>
                    </div>
                  )}

                  {stn.jurisdiction_pincodes && (
                    <div className="p-2 bg-light rounded border mb-3">
                      <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Covered Pincodes:</span>
                      <span className="font-monospace text-dark">{stn.jurisdiction_pincodes}</span>
                    </div>
                  )}

                  <div className="row g-2 pt-2 border-top text-center text-muted">
                    <div className="col-6">
                      <div className="fw-bold text-dark fs-6">{stn.officer_count || 0}</div>
                      <div style={{ fontSize: '0.7rem' }}>Enrolled Officers</div>
                    </div>
                    <div className="col-6">
                      <div className="fw-bold text-dark fs-6">{stn.complaint_count || 0}</div>
                      <div style={{ fontSize: '0.7rem' }}>Total Grievances</div>
                    </div>
                  </div>
                </div>

                <div className="card-footer bg-white p-3 border-top d-flex justify-content-end">
                  <button
                    onClick={() => handleOpenEdit(stn)}
                    className="btn btn-outline-primary btn-sm"
                  >
                    Edit Station Info
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Station Modal */}
      {showModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-navy text-white" style={{ backgroundColor: '#0b2545' }}>
                <h5 className="modal-title fw-bold">
                  {editingStation ? 'Edit Police Station' : 'Register New Police Station'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">
                        Station Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Cyber Crime Police Station"
                        value={formData.stationName}
                        onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">
                        Station Identifier Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. STN-CYB-002"
                        value={formData.stationCode}
                        onChange={(e) => setFormData({ ...formData, stationCode: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-secondary">
                        Full Address Location <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Sector 62, Electronic City"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">District <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Gautam Buddha Nagar"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">State / UT <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Uttar Pradesh"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">
                        Direct Helpline / Phone <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="e.g. +91-120-2440001"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Official Station Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. cyberps.noida@police.gov.in"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-secondary">
                        Covered Jurisdiction Pincodes (Comma separated)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 201301, 201307, 201309"
                        value={formData.jurisdictionPincodes}
                        onChange={(e) => setFormData({ ...formData, jurisdictionPincodes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm fw-bold px-4" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Station Record'}
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
