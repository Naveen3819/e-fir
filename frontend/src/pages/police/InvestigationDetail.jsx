import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { toast } from 'react-toastify';
import {
  BsShieldCheck,
  BsFileEarmarkPlus,
  BsPaperclip,
  BsArrowLeft,
  BsCheckCircleFill,
  BsFileText,
  BsDownload,
  BsClockHistory,
} from 'react-icons/bs';

export default function InvestigationDetail() {
  const { firId } = useParams();
  const [fir, setFir] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State for new update
  const [updateType, setUpdateType] = useState('Case Diary');
  const [description, setDescription] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInvestigation();
  }, [firId]);

  const fetchInvestigation = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/investigations/${firId}`);
      if (res.data.success) {
        setFir(res.data.fir);
        setUpdates(res.data.updates || []);
        setNewStatus(res.data.fir.status);
      }
    } catch (e) {
      toast.error(e.message || 'Error fetching investigation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.warn('Please enter investigation progress details.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('updateType', updateType);
      formData.append('description', description);
      if (newStatus && newStatus !== fir.status) {
        formData.append('newFIRStatus', newStatus);
      }
      if (docFile) {
        formData.append('document', docFile);
      }

      const res = await api.post(`/investigations/${firId}/updates`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Investigation update recorded.');
        setDescription('');
        setDocFile(null);
        fetchInvestigation();
      }
    } catch (err) {
      toast.error(err.message || 'Error recording update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadDoc = (updateId) => {
    const token = localStorage.getItem('efir_token');
    const url = `/api/evidence/documents/${updateId}/download`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `police_doc_${updateId}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((e) => toast.error(e.message));
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="small text-muted mt-2">Loading investigation diary...</div>
      </div>
    );
  }

  if (!fir) {
    return <div className="alert alert-danger">FIR investigation record not found.</div>;
  }

  return (
    <div>
      {/* Header and Back Link */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link to="/police/firs" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <BsArrowLeft />
            <span>FIR Registry</span>
          </Link>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold text-navy mb-0" style={{ color: '#0b2545' }}>
                {fir.fir_number}
              </h4>
              <StatusBadge status={fir.status} />
            </div>
            <p className="text-muted small mb-0">
              Investigation Case Diary &amp; Procedural Documentation
            </p>
          </div>
        </div>

        <Link
          to={`/police/complaints/${fir.complaint_id}`}
          className="btn btn-outline-primary btn-sm"
        >
          View Originating Complaint
        </Link>
      </div>

      {/* FIR Summary Box */}
      <div className="gov-card p-4 shadow-sm mb-4">
        <div className="row g-3 small">
          <div className="col-md-3">
            <span className="text-muted d-block">Complainant</span>
            <strong className="text-dark fs-6">{fir.complainant_name}</strong>
          </div>
          <div className="col-md-3">
            <span className="text-muted d-block">Jurisdiction Station</span>
            <strong className="text-primary">{fir.station_name}</strong>
          </div>
          <div className="col-md-3">
            <span className="text-muted d-block">Designated IO</span>
            <strong className="text-dark">
              {fir.io_name ? `${fir.io_rank} ${fir.io_name}` : 'Unassigned'}
            </strong>
          </div>
          <div className="col-md-3">
            <span className="text-muted d-block">Applicable Legal Sections</span>
            <span className="badge bg-secondary-subtle text-primary border">{fir.sections}</span>
          </div>
          <div className="col-12 mt-2 pt-2 border-top">
            <span className="text-muted d-block">Accused Information:</span>
            <span className="text-dark fw-semibold">
              {fir.accused_details || 'Unknown persons under ongoing investigation'}
            </span>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Record New Investigation Entry */}
        <div className="col-lg-5">
          <div className="gov-card shadow-sm h-100">
            <div className="gov-card-header bg-light d-flex align-items-center gap-2">
              <BsFileEarmarkPlus className="fs-5 text-primary" />
              <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                Record Case Diary / Action Entry
              </h6>
            </div>

            <div className="gov-card-body p-4">
              <form onSubmit={handleAddUpdate}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">
                    Investigation Event / Action Type
                  </label>
                  <select
                    className="form-select"
                    value={updateType}
                    onChange={(e) => setUpdateType(e.target.value)}
                  >
                    <option value="Case Diary">Case Diary Entry</option>
                    <option value="Evidence Collected">Physical / Digital Evidence Collected</option>
                    <option value="Witness Interrogation">Witness Statement Recorded</option>
                    <option value="Panchnama">Panchnama Conducted</option>
                    <option value="Notice Issued">Section 91 / 41A CrPC Notice Issued</option>
                    <option value="Chargesheet Filed">Final Chargesheet Filed</option>
                    <option value="Closure Report">Final Closure / FR Submitted</option>
                    <option value="Status Change">General Status Milestone</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">
                    Advance FIR Investigation Status
                  </label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="Registered">Registered</option>
                    <option value="Investigation Started">Investigation Started</option>
                    <option value="Evidence Collection">Evidence Collection</option>
                    <option value="Verification">Verification &amp; Interrogation</option>
                    <option value="Further Action">Further Action / Court Remand</option>
                    <option value="Completed">Completed (Case Resolved)</option>
                    <option value="Chargesheet Filed">Chargesheet Filed in Court</option>
                    <option value="Closed">Closed</option>
                  </select>
                  <div className="form-text small">
                    Advancing to Completed/Closed will mark the originating complaint as Resolved.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">
                    Detailed Progress Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="Enter factual case diary narrative, inspection observations, suspect questioning summary..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-secondary">
                    Attach Official Police Document (PDF / Doc)
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setDocFile(e.target.files[0] || null)}
                  />
                  <div className="form-text small">Panchnama copy, forensic report, chargesheet copy</div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-semibold shadow-sm"
                  disabled={submitting}
                >
                  {submitting ? 'Recording Entry...' : 'Save Investigation Entry'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Chronological Investigation Timeline */}
        <div className="col-lg-7">
          <div className="gov-card shadow-sm h-100">
            <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <BsClockHistory className="text-primary fs-5" />
                <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                  Immutable Case Diary Log ({updates.length})
                </h6>
              </div>
              <span className="badge bg-secondary-subtle text-primary border">Chronological Record</span>
            </div>

            <div className="gov-card-body p-4" style={{ maxHeight: '520px', overflowY: 'auto' }}>
              {updates.length === 0 ? (
                <div className="text-center py-5 text-muted small">
                  No diary entries recorded yet.
                </div>
              ) : (
                <div className="ps-3 border-start border-3 border-primary">
                  {updates.map((up) => (
                    <div key={up.id} className="mb-4 position-relative ps-3">
                      <div
                        className="position-absolute bg-primary rounded-circle"
                        style={{ width: '12px', height: '12px', left: '-22px', top: '4px' }}
                      />
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-1 mb-1">
                        <span className="badge bg-primary-subtle text-primary border fw-semibold">
                          {up.update_type}
                        </span>
                        <small className="text-muted">
                          {new Date(up.created_at).toLocaleString()}
                        </small>
                      </div>

                      <p className="text-dark small mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                        {up.description}
                      </p>

                      <div className="d-flex justify-content-between align-items-center small text-muted border-top pt-2">
                        <span>
                          Officer: <strong className="text-dark">{up.officer_rank} {up.officer_name}</strong> (Badge: {up.employee_id})
                        </span>

                        {up.document_filename && (
                          <button
                            onClick={() => handleDownloadDoc(up.id)}
                            className="btn btn-outline-secondary btn-sm p-1 px-2 d-inline-flex align-items-center gap-1"
                            title="Download official report attachment"
                          >
                            <BsDownload />
                            <span>{up.document_filename}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
