import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import VisualTimeline from '../../components/VisualTimeline';
import AcknowledgementSlip from '../../components/AcknowledgementSlip';
import { toast } from 'react-toastify';
import {
  BsShieldCheck,
  BsFileEarmarkText,
  BsDownload,
  BsReplyFill,
  BsStarFill,
  BsArrowLeft,
  BsPrinter,
  BsExclamationTriangleFill,
  BsCheckCircleFill,
} from 'react-icons/bs';

export default function ComplaintDetails() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'timeline' | 'acknowledgement'

  // Response to Info Request state
  const [responseText, setResponseText] = useState('');
  const [responseFiles, setResponseFiles] = useState([]);
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Feedback state
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const fetchComplaintDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/complaints/${id}`);
      if (res.data.success) {
        setComplaint(res.data.complaint);
        if (res.data.complaint.feedback) {
          setRating(res.data.complaint.feedback.rating);
          setFeedbackComments(res.data.complaint.feedback.comments || '');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Error fetching complaint details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadEvidence = (evidenceId) => {
    // Open secure evidence streaming route with auth token
    const token = localStorage.getItem('efir_token');
    const url = `/api/evidence/${evidenceId}/download`;
    // Create an invisible link to trigger download with auth
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('File download failed');
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

  // Submit response to information request
  const handleInfoResponseSubmit = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) {
      toast.warn('Please enter a response message.');
      return;
    }

    setSubmittingResponse(true);
    try {
      const formData = new FormData();
      formData.append('responseMessage', responseText);
      responseFiles.forEach((file) => {
        formData.append('evidenceFiles', file);
      });

      const res = await api.post(`/complaints/${id}/respond`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setResponseText('');
        setResponseFiles([]);
        fetchComplaintDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit response.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Submit Feedback
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const res = await api.post('/feedback', {
        complaintId: complaint.id,
        rating,
        comments: feedbackComments,
      });

      if (res.data.success) {
        toast.success('Thank you for providing your feedback!');
        setFeedbackSuccess(true);
        fetchComplaintDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="small text-muted mt-2">Loading complaint file...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="alert alert-danger">
        Complaint record not found or you are not authorized to view it.
      </div>
    );
  }

  const isResolvedOrClosed = ['Resolved', 'Closed'].includes(complaint.status);

  return (
    <div>
      {/* Header and Back Link */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link to="/complaints" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <BsArrowLeft />
            <span>Back</span>
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

        {/* View Tabs */}
        <div className="btn-group no-print">
          <button
            onClick={() => setActiveTab('details')}
            className={`btn btn-sm ${activeTab === 'details' ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            Case File
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`btn btn-sm ${activeTab === 'timeline' ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            Timeline &amp; Updates
          </button>
          <button
            onClick={() => setActiveTab('acknowledgement')}
            className={`btn btn-sm ${activeTab === 'acknowledgement' ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            Acknowledgment Slip
          </button>
        </div>
      </div>

      {/* Tab: Acknowledgment Slip */}
      {activeTab === 'acknowledgement' && (
        <AcknowledgementSlip complaint={complaint} />
      )}

      {/* Tab: Timeline */}
      {activeTab === 'timeline' && (
        <div className="gov-card p-4 shadow-sm">
          <h5 className="fw-bold text-navy mb-3" style={{ color: '#0b2545' }}>
            Case Investigation Timeline
          </h5>
          <VisualTimeline
            currentStatus={complaint.status}
            updates={complaint.investigationUpdates || []}
            createdAt={complaint.created_at}
          />
        </div>
      )}

      {/* Tab: Details */}
      {activeTab === 'details' && (
        <>
          {/* Action Required: Information Request Alert */}
          {complaint.status === 'Information Required' && (
            <div className="card border-warning mb-4 shadow-sm bg-warning bg-opacity-10">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 text-warning-emphasis fw-bold fs-5 mb-2">
                  <BsExclamationTriangleFill className="text-warning" />
                  <span>Police Officer Information Request</span>
                </div>
                <div className="p-3 bg-white rounded border mb-3">
                  <span className="text-muted small fw-bold d-block mb-1">Officer Inquiry:</span>
                  <div className="text-dark fw-semibold">{complaint.info_request_message}</div>
                </div>

                <form onSubmit={handleInfoResponseSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      Your Response / Clarification <span className="text-danger">*</span>
                    </label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Type your response and explanation here..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      Attach Requested Documents / Evidence
                    </label>
                    <input
                      type="file"
                      multiple
                      className="form-control"
                      onChange={(e) => setResponseFiles(Array.from(e.target.files))}
                    />
                    <div className="form-text small">Max 50MB per file (Images, PDF, Word, Audio/Video)</div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-warning fw-bold px-4 shadow-sm"
                    disabled={submittingResponse}
                  >
                    {submittingResponse ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                    ) : (
                      <BsReplyFill className="fs-5 me-1" />
                    )}
                    Submit Response to Investigating Officer
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Official FIR Registered Banner */}
          {complaint.fir_number && (
            <div className="gov-card p-4 shadow-sm mb-4 border-primary border-2 bg-primary bg-opacity-10">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <div className="d-flex align-items-center gap-2 text-primary fw-bold text-uppercase small mb-1">
                    <BsShieldCheck className="fs-4" />
                    <span>Official First Information Report (FIR) Registered</span>
                  </div>
                  <div className="fs-3 fw-bold font-monospace text-dark">
                    {complaint.fir_number}
                  </div>
                  <div className="small text-muted mt-1">
                    Applicable Acts / Sections:{' '}
                    <strong className="text-dark">{complaint.fir_sections}</strong>
                  </div>
                </div>
                {complaint.fir_io_name && (
                  <div className="text-end">
                    <div className="small text-muted">Investigating Officer</div>
                    <div className="fw-bold text-navy">
                      {complaint.fir_io_rank} {complaint.fir_io_name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection notice if applicable */}
          {complaint.status === 'Rejected' && (
            <div className="alert alert-danger mb-4 p-4 shadow-sm">
              <h5 className="fw-bold text-danger mb-2">Complaint Formally Rejected</h5>
              <p className="mb-0">
                <strong>Stated Reason: </strong>
                {complaint.rejection_reason || 'Does not fall within cognizable legal jurisdiction.'}
              </p>
            </div>
          )}

          {/* Main Case Info Grid */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="gov-card shadow-sm h-100">
                <div className="gov-card-header bg-light">
                  <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                    Incident Details
                  </h6>
                </div>
                <div className="gov-card-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <span className="text-muted small d-block">Category</span>
                      <span className="badge bg-secondary">{complaint.category_name}</span>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted small d-block">Incident Date &amp; Time</span>
                      <strong className="text-dark">
                        {complaint.incident_date} {complaint.incident_time ? `at ${complaint.incident_time}` : ''}
                      </strong>
                    </div>
                    <div className="col-12">
                      <span className="text-muted small d-block">Incident Location</span>
                      <strong className="text-dark">
                        {complaint.incident_location}, {complaint.district}, {complaint.state} - {complaint.pincode}
                      </strong>
                    </div>
                  </div>

                  <div className="border-top pt-3">
                    <span className="text-muted small fw-bold d-block mb-1">Full Incident Statement:</span>
                    <div className="p-3 bg-light rounded border text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                      {complaint.description}
                    </div>
                  </div>

                  {complaint.remarks && (
                    <div className="mt-3 p-3 bg-info bg-opacity-10 border border-info rounded">
                      <span className="small text-info-emphasis fw-bold d-block">Officer Notes / Remarks:</span>
                      <span className="small text-dark">{complaint.remarks}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="gov-card shadow-sm h-100">
                <div className="gov-card-header bg-light">
                  <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                    Police Station Details
                  </h6>
                </div>
                <div className="gov-card-body p-4 small">
                  <div className="mb-3">
                    <span className="text-muted d-block">Station Name</span>
                    <strong className="text-primary fs-6">{complaint.station_name}</strong>
                    <div className="font-monospace text-muted">{complaint.station_code}</div>
                  </div>
                  <div className="mb-3">
                    <span className="text-muted d-block">Station Address</span>
                    <span className="text-dark">{complaint.station_address}</span>
                  </div>
                  <div className="mb-3">
                    <span className="text-muted d-block">Contact Phone</span>
                    <span className="text-dark fw-bold">{complaint.station_contact}</span>
                  </div>
                  <div className="mb-3">
                    <span className="text-muted d-block">Official Email</span>
                    <span className="text-muted">{complaint.station_email || 'N/A'}</span>
                  </div>
                  {complaint.assigned_officer_name && (
                    <div className="p-2 bg-light rounded border mt-3">
                      <span className="text-muted d-block">Designated Officer</span>
                      <strong className="text-dark">
                        {complaint.assigned_officer_rank} {complaint.assigned_officer_name}
                      </strong>
                      <div className="text-muted small">Badge: {complaint.assigned_officer_badge}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Files List */}
          <div className="gov-card shadow-sm mb-4">
            <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                Attached Digital Evidence ({complaint.evidence?.length || 0})
              </h6>
              <span className="small text-muted">🔒 Cryptographically Hashed (SHA-256)</span>
            </div>
            <div className="gov-card-body p-0">
              {complaint.evidence?.length === 0 ? (
                <div className="p-4 text-center text-muted small">No evidence files attached to this complaint.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light text-muted">
                      <tr>
                        <th className="ps-4">Original Filename</th>
                        <th>File Type</th>
                        <th>Size</th>
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
                            {ev.file_hash ? `${ev.file_hash.substring(0, 16)}...` : 'Computed'}
                          </td>
                          <td className="text-end pe-4">
                            <button
                              onClick={() => handleDownloadEvidence(ev.id)}
                              className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                            >
                              <BsDownload />
                              <span>Download</span>
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

          {/* Citizen Feedback Form if Case is Resolved / Closed */}
          {isResolvedOrClosed && (
            <div className="gov-card shadow-sm p-4 border-success">
              <h5 className="fw-bold text-success mb-2 d-flex align-items-center gap-2">
                <BsCheckCircleFill /> Citizen Grievance Redressal Feedback
              </h5>
              <p className="text-muted small mb-3">
                Your grievance has been concluded. Please rate the responsiveness and assistance provided by the police station.
              </p>

              {complaint.feedback && !feedbackSuccess ? (
                <div className="p-3 bg-light rounded border">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="text-warning fs-5">
                      {'★'.repeat(complaint.feedback.rating)}
                      {'☆'.repeat(5 - complaint.feedback.rating)}
                    </span>
                    <span className="fw-bold text-dark">({complaint.feedback.rating} / 5 Stars)</span>
                  </div>
                  {complaint.feedback.comments && (
                    <p className="text-muted small mb-0">"{complaint.feedback.comments}"</p>
                  )}
                  <small className="text-muted d-block mt-2">
                    Submitted on: {new Date(complaint.feedback.created_at).toLocaleString()}
                  </small>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      Service Satisfaction Rating
                    </label>
                    <div className="d-flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`btn btn-sm ${star <= rating ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                        >
                          ★ {star}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      Comments / Observations on Police Handling
                    </label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Share your experience regarding speed of response, officer courtesy, or overall resolution..."
                      value={feedbackComments}
                      onChange={(e) => setFeedbackComments(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success fw-bold px-4"
                    disabled={submittingFeedback}
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Departmental Feedback'}
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
