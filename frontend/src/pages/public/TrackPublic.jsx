import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import VisualTimeline from '../../components/VisualTimeline';
import { BsSearch, BsCheckCircleFill, BsShieldCheck, BsExclamationCircle } from 'react-icons/bs';

export default function TrackPublic() {
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusData, setStatusData] = useState(null);

  const handleTrack = async (searchRef) => {
    const refToUse = (searchRef || reference).trim();
    if (!refToUse) {
      setErrorMsg('Please enter a complaint reference number.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setStatusData(null);

    try {
      const res = await api.get(`/complaints/status/${encodeURIComponent(refToUse)}`);
      if (res.data.success) {
        setStatusData(res.data.statusData);
      } else {
        setErrorMsg('Complaint reference not found.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Complaint not found. Please verify the reference number.');
    } finally {
      setLoading(false);
    }
  };

  const sampleRefs = ['E-FIR-2026-000101', 'E-FIR-2026-000102', 'E-FIR-2026-000104'];

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <div className="container py-5 my-auto">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="text-center mb-4">
              <h3 className="fw-bold text-navy" style={{ color: '#0b2545' }}>
                Track Complaint &amp; E-FIR Status
              </h3>
              <p className="text-muted small">
                Enter your unique electronic complaint reference number (e.g. E-FIR-2026-000101) to view real-time stage updates.
              </p>
            </div>

            {/* Tracking Input Card */}
            <div className="gov-card p-4 shadow-sm mb-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTrack();
                }}
              >
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-light text-muted">
                    <BsSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Reference Number (e.g. E-FIR-2026-000101)"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary fw-semibold px-4" disabled={loading}>
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                    ) : null}
                    Track Status
                  </button>
                </div>
              </form>

              <div className="d-flex align-items-center gap-2 mt-3 small text-muted">
                <span>Sample demo references to test:</span>
                {sampleRefs.map((ref) => (
                  <button
                    key={ref}
                    type="button"
                    onClick={() => {
                      setReference(ref);
                      handleTrack(ref);
                    }}
                    className="badge bg-light text-primary border border-primary-subtle text-decoration-none cursor-pointer"
                    style={{ cursor: 'pointer' }}
                  >
                    {ref}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="alert alert-danger d-flex align-items-center mb-4">
                <BsExclamationCircle className="fs-4 me-2" />
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Results Display */}
            {statusData && (
              <div className="gov-card shadow-sm">
                <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
                  <div>
                    <span className="small text-muted text-uppercase fw-bold">Case Reference: </span>
                    <strong className="fs-5 text-primary font-monospace ms-1">
                      {statusData.complaint_number}
                    </strong>
                  </div>
                  <StatusBadge status={statusData.status} />
                </div>

                <div className="gov-card-body p-4">
                  {/* Visual Timeline */}
                  <div className="mb-4">
                    <h6 className="fw-bold text-navy mb-3" style={{ color: '#0b2545' }}>
                      Case Progression Stage
                    </h6>
                    <VisualTimeline currentStatus={statusData.status} />
                  </div>

                  <div className="row g-3 p-3 bg-light rounded border mb-4">
                    <div className="col-md-6">
                      <div className="small text-muted">Incident Title</div>
                      <strong className="text-dark">{statusData.title}</strong>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Category</div>
                      <span className="badge bg-secondary">{statusData.category_name}</span>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Police Station</div>
                      <strong className="text-navy">{statusData.station_name}</strong>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Station Helpline</div>
                      <span className="text-primary fw-semibold">{statusData.station_contact}</span>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Incident Date</div>
                      <span className="text-dark">{statusData.incident_date}</span>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Filing Date</div>
                      <span className="text-dark">{new Date(statusData.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Registered FIR details if applicable */}
                  {statusData.fir_number && (
                    <div className="p-3 bg-primary bg-opacity-10 rounded border border-primary mb-3">
                      <div className="d-flex align-items-center gap-2 text-primary fw-bold mb-1">
                        <BsShieldCheck className="fs-4" />
                        <span>Official FIR Registered</span>
                      </div>
                      <div className="fs-5 fw-bold font-monospace text-dark mb-1">
                        {statusData.fir_number}
                      </div>
                      <div className="small text-muted">
                        FIR Registration Date: {new Date(statusData.fir_date).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Remarks / Rejection Reason */}
                  {statusData.rejection_reason && (
                    <div className="alert alert-danger mb-3">
                      <strong>Rejection Reason: </strong>
                      <span>{statusData.rejection_reason}</span>
                    </div>
                  )}

                  {statusData.remarks && (
                    <div className="p-3 bg-light rounded border text-muted small">
                      <strong>Official Officer Remarks: </strong>
                      <span>{statusData.remarks}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
