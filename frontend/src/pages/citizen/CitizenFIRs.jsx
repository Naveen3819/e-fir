import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { BsShieldCheck, BsEye, BsCalendarEvent, BsFileEarmarkText } from 'react-icons/bs';

export default function CitizenFIRs() {
  const [firs, setFirs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFIRs();
  }, []);

  const fetchFIRs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/firs');
      if (res.data.success) {
        setFirs(res.data.firs || []);
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
          Registered First Information Reports (FIRs)
        </h4>
        <p className="text-muted small mb-0">
          Official statutory FIR records authorized and registered by police stations for your submitted complaints.
        </p>
      </div>

      <div className="gov-card shadow-sm">
        <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <BsShieldCheck className="text-primary fs-5" />
            <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
              Official FIR Records ({firs.length})
            </h6>
          </div>
        </div>

        <div className="gov-card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="small text-muted mt-2">Loading official FIR records...</div>
            </div>
          ) : firs.length === 0 ? (
            <div className="text-center py-5 px-3">
              <div className="fs-1 text-muted mb-2">🛡️</div>
              <h6 className="fw-bold text-secondary">No Registered FIRs Found</h6>
              <p className="small text-muted mb-0">
                An online complaint becomes an FIR only after police preliminary verification. When an officer approves your grievance, the official FIR will appear here.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light text-muted text-uppercase">
                  <tr>
                    <th className="ps-4">FIR Number</th>
                    <th>Complaint Ref</th>
                    <th>Police Station</th>
                    <th>Sections / Acts</th>
                    <th>Registration Date</th>
                    <th>Investigating Officer</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {firs.map((f) => (
                    <tr key={f.id}>
                      <td className="ps-4 font-monospace fw-bold text-primary fs-6">
                        {f.fir_number}
                      </td>
                      <td className="font-monospace text-secondary">
                        <Link to={`/complaints/${f.complaint_id}`} className="text-decoration-none">
                          {f.complaint_number}
                        </Link>
                      </td>
                      <td className="fw-semibold text-dark">{f.station_name}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-dark border">
                          {f.sections}
                        </span>
                      </td>
                      <td className="text-muted">{new Date(f.registration_date).toLocaleDateString()}</td>
                      <td>
                        {f.io_name ? (
                          <span>
                            {f.io_rank} {f.io_name}
                          </span>
                        ) : (
                          <span className="text-muted fst-italic">Pending IO</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={f.status} />
                      </td>
                      <td className="text-end pe-4">
                        <Link
                          to={`/complaints/${f.complaint_id}`}
                          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                        >
                          <BsEye />
                          <span>View Case</span>
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
