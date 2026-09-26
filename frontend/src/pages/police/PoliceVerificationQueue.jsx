import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { BsCheck2Square, BsEye, BsSearch, BsClockFill } from 'react-icons/bs';

export default function PoliceVerificationQueue() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const [resSub, resVer, resInfo] = await Promise.all([
        api.get('/complaints?status=Submitted&limit=20'),
        api.get('/complaints?status=Under Verification&limit=20'),
        api.get('/complaints?status=Information Required&limit=20'),
      ]);

      const combined = [
        ...(resSub.data.complaints || []),
        ...(resVer.data.complaints || []),
        ...(resInfo.data.complaints || []),
      ];

      setComplaints(combined);
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
          Verification &amp; Decision Queue
        </h4>
        <p className="text-muted small mb-0">
          Cases requiring preliminary scrutiny, factual verification, citizen inquiry, or official FIR acceptance.
        </p>
      </div>

      <div className="gov-card shadow-sm">
        <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <BsCheck2Square className="text-primary fs-5" />
            <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
              Pending Verification Cases ({complaints.length})
            </h6>
          </div>
        </div>

        <div className="gov-card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="small text-muted mt-2">Loading verification queue...</div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-5">
              <div className="fs-1 text-success mb-2">✅</div>
              <h6 className="fw-bold text-secondary">All Complaints Verified</h6>
              <p className="small text-muted mb-0">No pending verification cases in queue.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light text-muted text-uppercase">
                  <tr>
                    <th className="ps-4">Reference Number</th>
                    <th>Complainant</th>
                    <th>Title &amp; Category</th>
                    <th>Filing Date</th>
                    <th>Status</th>
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
                        <div className="fw-semibold text-dark">{c.title}</div>
                        <span className="badge bg-secondary small">{c.category_name}</span>
                      </td>
                      <td className="text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="text-end pe-4">
                        <Link
                          to={`/police/complaints/${c.id}`}
                          className="btn btn-warning btn-sm fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                        >
                          <BsCheck2Square />
                          <span>Scrutinize &amp; Act</span>
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
