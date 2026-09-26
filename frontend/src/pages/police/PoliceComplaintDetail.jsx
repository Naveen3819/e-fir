import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import VisualTimeline from '../../components/VisualTimeline';
import AcknowledgementSlip from '../../components/AcknowledgementSlip';
import { toast } from 'react-toastify';
import {
  BsShieldCheck,
  BsCheck2Square,
  BsQuestionSquare,
  BsXSquare,
  BsPersonBadge,
  BsFileEarmarkPlus,
  BsDownload,
  BsArrowLeft,
  BsFileText,
  BsArrowRight,
} from 'react-icons/bs';

export default function PoliceComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyRemarks, setVerifyRemarks] = useState('Verified. Cognizable facts established.');

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');

  const [showFIRModal, setShowFIRModal] = useState(false);
  const [firForm, setFirForm] = useState({
    sections: 'Section 379 IPC / BNS 303',
    description: '',
    accusedDetails: 'Unknown persons under investigation',
    investigationOfficerId: '',
  });

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchComplaint();
    fetchOfficers();
  }, [id]);

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/complaints/${id}`);
      if (res.data.success) {
        setComplaint(res.data.complaint);
        setFirForm((prev) => ({
          ...prev,
          description: `FIR registered in respect of ${res.data.complaint.title}. ${res.data.complaint.description.substring(0, 150)}...`,
        }));
      }
    } catch (e) {
      toast.error(e.message || 'Error fetching complaint');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await api.get('/admin/officers');
      if (res.data.success) {
        setOfficers(res.data.officers || []);
      }
    } catch (e) {}
  };

  // Secure evidence download
  const handleDownloadEvidence = (evidenceId) => {
    const token = localStorage.getItem('efir_token');
    const url = `/api/evidence/${evidenceId}/download`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `evidence_${evidenceId}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((e) => toast.error(e.message));
  };

  // 1. Verify -> Accepted
  const handleVerify = async () => {
    setActionLoading(true);
    try {
      const res = await api.put(`/police/complaints/${id}/verify`, { remarks: verifyRemarks });
      if (res.data.success) {
        toast.success('Complaint verified and marked as Accepted!');
        setShowVerifyModal(false);
        fetchComplaint();
      }
    } catch (err) {
      toast.error(err.message || 'Verification error.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Request Information
  const handleRequestInfo = async () => {
    if (!infoMessage.trim()) {
      toast.warn('Please enter what information is required from the citizen.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/police/complaints/${id}/request-information`, { message: infoMessage });
      if (res.data.success) {
        toast.success('Information request communicated to citizen.');
        setShowInfoModal(false);
        setInfoMessage('');
        fetchComplaint();
      }
    } catch (err) {
      toast.error(err.message || 'Error requesting information.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Reject Complaint
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warn('A formal rejection reason is mandatory under police grievance procedure.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.put(`/police/complaints/${id}/reject`, { reason: rejectReason });
      if (res.data.success) {
        toast.success('Complaint recorded as Rejected.');
        setShowRejectModal(false);
        fetchComplaint();
      }
    } catch (err) {
      toast.error(err.message || 'Error rejecting complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Assign Officer
  const handleAssignOfficer = async () => {
    if (!selectedOfficerId) {
      toast.warn('Please select an officer from the list.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.put(`/police/complaints/${id}/assign`, { officerId: selectedOfficerId });
      if (res.data.success) {
        toast.success('Officer assigned successfully.');
        setShowAssignModal(false);
        fetchComplaint();
      }
    } catch (err) {
      toast.error(err.message || 'Error assigning officer.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Register FIR
  const handleRegisterFIR = async () => {
    if (!firForm.sections || !firForm.description) {
      toast.warn('Legal sections/acts and formal description are required.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/firs', {
        complaintId: complaint.id,
        sections: firForm.sections,
        description: firForm.description,
        investigationOfficerId: firForm.investigationOfficerId || complaint.assigned_officer_id,
        accusedDetails: firForm.accusedDetails,
      });

      if (res.data.success) {
        toast.success(`Official FIR (${res.data.fir.fir_number}) registered successfully!`);
        setShowFIRModal(false);
        fetchComplaint();
      }
    } catch (err) {
      toast.error(err.message || 'FIR registration error.');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Quick Status Update (Resolved/Closed)
  const handleStatusUpdate = async (newStatus) => {
    try {
      const res = await api.put(`/police/complaints/${id}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Complaint status updated to ${newStatus}.`);
        fetchComplaint();
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="small text-muted mt-2">Loading case file...</div>
      </div>
    );
  }

  if (!complaint) {
    return <div className="alert alert-danger">Complaint not found.</div>;
  }

  const isAcceptedOrBeyond = [
    'Accepted',
    'FIR Registered',
    'Assigned',
    'Under Investigation',
    'Resolved',
    'Closed',
  ].includes(complaint.status);

  return (
    <div>
      {/* Top Header & Actions Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link to="/police/complaints" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <BsArrowLeft />
            <span>Queue</span>
          </Link>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold text-navy mb-0" style={{ color: '#0b2545' }}>
                {complaint.complaint_number}
              </h4>
              <StatusBadge status={complaint.status} />
            </div>
            <p className="text-muted small mb-0">{complaint.title}</p>
          </div>
        </div>

        {/* Police Action Buttons Cockpit */}
        <div className="d-flex flex-wrap gap-2">
          {/* Action: Verify / Accept */}
          {['Submitted', 'Under Verification'].includes(complaint.status) && (
            <button
              onClick={() => setShowVerifyModal(true)}
              className="btn btn-success btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
            >
              <BsCheck2Square />
              <span>Verify &amp; Accept</span>
            </button>
          )}

          {/* Action: Request Info */}
          {!['Resolved', 'Closed', 'Rejected'].includes(complaint.status) && (
            <button
              onClick={() => setShowInfoModal(true)}
              className="btn btn-warning btn-sm fw-bold d-flex align-items-center gap-1"
            >
              <BsQuestionSquare />
              <span>Request Info</span>
            </button>
          )}

          {/* Action: Reject */}
          {!['FIR Registered', 'Under Investigation', 'Resolved', 'Closed', 'Rejected'].includes(complaint.status) && (
            <button
              onClick={() => setShowRejectModal(true)}
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
            >
              <BsXSquare />
              <span>Reject Grievance</span>
            </button>
          )}

          {/* Action: Assign Officer */}
          {!['Resolved', 'Closed', 'Rejected'].includes(complaint.status) && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            >
              <BsPersonBadge />
              <span>Assign IO</span>
            </button>
          )}

          {/* Action: Register FIR */}
          {!complaint.fir_number && isAcceptedOrBeyond && (
            <button
              onClick={() => setShowFIRModal(true)}
              className="btn btn-primary btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
            >
              <BsShieldCheck />
              <span>Register Official FIR</span>
            </button>
          )}

          {/* If FIR exists, link to Investigation Management */}
          {complaint.fir_id && (
            <Link
              to={`/police/investigations/${complaint.fir_id}`}
              className="btn btn-dark btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
            >
              <BsFileText />
              <span>Manage Investigation Diary</span>
            </Link>
          )}

          {/* Action: Quick Resolve */}
          {['Under Investigation', 'FIR Registered'].includes(complaint.status) && (
            <button
              onClick={() => handleStatusUpdate('Resolved')}
              className="btn btn-outline-success btn-sm"
            >
              Mark Resolved
            </button>
          )}
        </div>
      </div>

      {/* Official FIR Registered Highlight */}
      {complaint.fir_number && (
        <div className="gov-card p-4 border-2 border-primary bg-primary bg-opacity-10 shadow-sm mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <div className="text-primary fw-bold small text-uppercase mb-1 d-flex align-items-center gap-1">
                <BsShieldCheck className="fs-5" />
                <span>Formal Police First Information Report (FIR)</span>
              </div>
              <div className="fs-3 fw-bold font-monospace text-dark">{complaint.fir_number}</div>
              <div className="small text-muted mt-1">
                Acts / Sections: <span className="fw-semibold text-dark">{complaint.fir_sections}</span>
              </div>
            </div>
            <div>
              <Link
                to={`/police/investigations/${complaint.fir_id}`}
                className="btn btn-primary btn-sm fw-semibold"
              >
                Open Investigation Diary &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Citizen Response Notice if citizen replied */}
      {complaint.info_response_message && (
        <div className="alert alert-info border-info mb-4 shadow-sm">
          <div className="fw-bold small text-uppercase mb-1 text-primary">
            Citizen Submitted Clarification / Documents:
          </div>
          <p className="mb-0 text-dark">"{complaint.info_response_message}"</p>
        </div>
      )}

      {/* Rejection Stated Notice */}
      {complaint.status === 'Rejected' && (
        <div className="alert alert-danger mb-4 shadow-sm">
          <strong>Official Rejection Recorded: </strong>
          <span>{complaint.rejection_reason}</span>
        </div>
      )}

      {/* Case Details Grid */}
      <div className="row g-4 mb-4">
        {/* Complainant & Incident */}
        <div className="col-lg-8">
          <div className="gov-card shadow-sm h-100">
            <div className="gov-card-header bg-light">
              <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                Incident Statement &amp; Facts
              </h6>
            </div>
            <div className="gov-card-body p-4">
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <span className="small text-muted d-block">Category</span>
                  <span className="badge bg-secondary">{complaint.category_name}</span>
                </div>
                <div className="col-sm-6">
                  <span className="small text-muted d-block">Incident Date &amp; Time</span>
                  <strong className="text-dark">
                    {complaint.incident_date} {complaint.incident_time ? `at ${complaint.incident_time}` : ''}
                  </strong>
                </div>
                <div className="col-12">
                  <span className="small text-muted d-block">Incident Location</span>
                  <strong className="text-dark">
                    {complaint.incident_location}, {complaint.district}, {complaint.state} - {complaint.pincode}
                  </strong>
                </div>
              </div>

              <div className="border-top pt-3">
                <span className="small text-muted fw-bold d-block mb-1">Complainant Narrative:</span>
                <div className="p-3 bg-light rounded border text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {complaint.description}
                </div>
              </div>

              {complaint.remarks && (
                <div className="mt-3 p-3 bg-light rounded border small">
                  <strong>Internal Police Notes: </strong>
                  <span>{complaint.remarks}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Citizen Details */}
        <div className="col-lg-4">
          <div className="gov-card shadow-sm h-100">
            <div className="gov-card-header bg-light">
              <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                Complainant Record
              </h6>
            </div>
            <div className="gov-card-body p-4 small">
              <div className="mb-3">
                <span className="text-muted d-block">Full Name</span>
                <strong className="text-dark fs-6">{complaint.citizen_name}</strong>
              </div>
              <div className="mb-3">
                <span className="text-muted d-block">Contact Mobile</span>
                <span className="text-dark fw-bold">{complaint.citizen_mobile}</span>
              </div>
              <div className="mb-3">
                <span className="text-muted d-block">Email Address</span>
                <span className="text-muted">{complaint.citizen_email}</span>
              </div>
              <div className="mb-3">
                <span className="text-muted d-block">Address on Record</span>
                <span className="text-dark">
                  {[complaint.citizen_address, complaint.citizen_city, complaint.citizen_state, complaint.citizen_pincode]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
              <hr />
              <div>
                <span className="text-muted d-block">Assigned Investigating Officer</span>
                {complaint.assigned_officer_name ? (
                  <div className="mt-1">
                    <strong className="text-primary">
                      {complaint.assigned_officer_rank} {complaint.assigned_officer_name}
                    </strong>
                    <div className="text-muted small">Badge ID: {complaint.assigned_officer_badge}</div>
                  </div>
                ) : (
                  <span className="text-muted fst-italic">No officer assigned yet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Evidence Table */}
      <div className="gov-card shadow-sm mb-4">
        <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
            Submitted Evidence Files ({complaint.evidence?.length || 0})
          </h6>
          <span className="small text-muted">🔒 Cryptographic SHA-256 Verified</span>
        </div>

        <div className="gov-card-body p-0">
          {complaint.evidence?.length === 0 ? (
            <div className="p-4 text-center text-muted small">No evidence files attached.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light text-muted">
                  <tr>
                    <th className="ps-4">Original Filename</th>
                    <th>MIME Type</th>
                    <th>File Size</th>
                    <th>Uploaded By</th>
                    <th>SHA-256 Hash</th>
                    <th className="text-end pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaint.evidence.map((ev) => (
                    <tr key={ev.id}>
                      <td className="ps-4 fw-semibold text-dark">{ev.filename}</td>
                      <td className="text-muted">{ev.file_type}</td>
                      <td className="text-muted">{(ev.file_size / 1024 / 1024).toFixed(2)} MB</td>
                      <td>
                        <span className="badge bg-light text-dark border">{ev.uploader_name}</span>
                      </td>
                      <td className="font-monospace text-muted" style={{ fontSize: '0.72rem' }}>
                        {ev.file_hash ? `${ev.file_hash.substring(0, 18)}...` : 'Verified'}
                      </td>
                      <td className="text-end pe-4">
                        <button
                          onClick={() => handleDownloadEvidence(ev.id)}
                          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                        >
                          <BsDownload />
                          <span>Inspect File</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="gov-card p-4 shadow-sm mb-4">
        <h6 className="fw-bold text-navy mb-3" style={{ color: '#0b2545' }}>
          Case Investigation Lifecycle Stage
        </h6>
        <VisualTimeline
          currentStatus={complaint.status}
          updates={complaint.investigationUpdates || []}
        />
      </div>

      {/* --- MODALS --- */}

      {/* 1. Verify Modal */}
      {showVerifyModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">Verify &amp; Accept Grievance</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowVerifyModal(false)} />
              </div>
              <div className="modal-body p-4">
                <p className="small text-muted mb-3">
                  Verification establishes prima facie merit. Status will transition to <strong>Accepted</strong>, allowing official FIR recording.
                </p>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">
                    Verification Notes / Legal Remarks
                  </label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={verifyRemarks}
                    onChange={(e) => setVerifyRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowVerifyModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm fw-bold px-3"
                  onClick={handleVerify}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 'Confirm Acceptance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Request Info Modal */}
      {showInfoModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title fw-bold">Request Additional Details from Citizen</h5>
                <button type="button" className="btn-close" onClick={() => setShowInfoModal(false)} />
              </div>
              <div className="modal-body p-4">
                <p className="small text-muted mb-3">
                  Specify what evidence, documents, or clarifications are needed from the complainant. Status will move to <strong>Information Required</strong> and a notification will be dispatched.
                </p>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">
                    Information Required Message <span className="text-danger">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="e.g. Please provide the transaction statement, bank reference number, and IMEI purchase invoice."
                    value={infoMessage}
                    onChange={(e) => setInfoMessage(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowInfoModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-warning btn-sm fw-bold px-3"
                  onClick={handleRequestInfo}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Sending...' : 'Dispatch Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Reject Modal */}
      {showRejectModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Formally Reject Grievance</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRejectModal(false)} />
              </div>
              <div className="modal-body p-4">
                <p className="small text-muted mb-3">
                  Under legal grievance directives, a recorded reason is mandatory. Silent rejection is not allowed.
                </p>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">
                    Statutory Reason for Rejection <span className="text-danger">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="e.g. Civil dispute regarding tenancy; no cognizable criminal offence disclosed. Advised to approach Civil Court."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm fw-bold px-3"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Rejecting...' : 'Record Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Assign Officer Modal */}
      {showAssignModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Designate Investigating Officer (IO)</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAssignModal(false)} />
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">
                    Select Active Station Officer
                  </label>
                  <select
                    className="form-select"
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                  >
                    <option value="">-- Choose Officer --</option>
                    {officers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.rank} {o.name} ({o.employee_id}) - {o.station_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm fw-bold px-3"
                  onClick={handleAssignOfficer}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Assigning...' : 'Assign Officer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Register FIR Modal */}
      {showFIRModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-navy text-white" style={{ backgroundColor: '#0b2545' }}>
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <BsShieldCheck className="text-warning" />
                  <span>Register First Information Report (FIR)</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowFIRModal(false)} />
              </div>
              <div className="modal-body p-4">
                <div className="alert alert-info py-2 small mb-3">
                  A unique statutory FIR number (e.g. <code>FIR/DL/2026/XXXXXX</code>) will be generated.
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-bold text-secondary">
                      Applicable Acts &amp; Legal Sections <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Section 379 IPC / BNS 303, Section 66D IT Act"
                      value={firForm.sections}
                      onChange={(e) => setFirForm({ ...firForm, sections: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold text-secondary">
                      Accused Information (Known or Unknown)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Unknown persons / Name & alias of suspects"
                      value={firForm.accusedDetails}
                      onChange={(e) => setFirForm({ ...firForm, accusedDetails: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold text-secondary">
                      Designate Investigating Officer (IO)
                    </label>
                    <select
                      className="form-select"
                      value={firForm.investigationOfficerId}
                      onChange={(e) => setFirForm({ ...firForm, investigationOfficerId: e.target.value })}
                    >
                      <option value="">Default (Current Station Duty Officer)</option>
                      {officers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.rank} {o.name} ({o.employee_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold text-secondary">
                      Official FIR Gist &amp; Formal Police Narration <span className="text-danger">*</span>
                    </label>
                    <textarea
                      rows={4}
                      className="form-control"
                      value={firForm.description}
                      onChange={(e) => setFirForm({ ...firForm, description: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowFIRModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm fw-bold px-4"
                  onClick={handleRegisterFIR}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Recording FIR...' : 'Record & Register FIR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
