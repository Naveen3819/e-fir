import React from 'react';
import { BsPrinter, BsShieldCheck } from 'react-icons/bs';

export default function AcknowledgementSlip({ complaint }) {
  if (!complaint) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="d-flex justify-content-end mb-3 no-print">
        <button onClick={handlePrint} className="btn btn-outline-primary d-flex align-items-center gap-2">
          <BsPrinter className="fs-5" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      <div className="official-document">
        <div className="official-watermark">POLICE DEPT</div>

        {/* Header */}
        <div className="text-center border-bottom pb-3 mb-4">
          <div className="d-flex justify-content-center align-items-center gap-2 mb-1">
            <BsShieldCheck className="text-primary fs-2" />
            <h4 className="fw-bold mb-0 text-navy" style={{ color: '#0b2545', letterSpacing: '0.05em' }}>
              STATE POLICE CITIZEN SERVICES PORTAL
            </h4>
          </div>
          <p className="text-muted small mb-0">E-FIR & CITIZEN GRIEVANCE ELECTRONIC ACKNOWLEDGEMENT</p>
          <small className="text-secondary fw-semibold">
            Issued in accordance with Police Electronic Complaint Recording Directives
          </small>
        </div>

        {/* Reference & QR Code */}
        <div className="row align-items-center mb-4 p-3 bg-light rounded border">
          <div className="col-md-8">
            <div className="small text-muted text-uppercase fw-bold">Electronic Reference Number</div>
            <div className="fs-4 fw-bold text-primary font-monospace">{complaint.complaint_number}</div>
            <div className="small text-muted mt-1">
              Submission Date & Time:{' '}
              <span className="fw-semibold text-dark">
                {new Date(complaint.created_at).toLocaleString()}
              </span>
            </div>
            <div className="small text-muted">
              Current Portal Status:{' '}
              <span className="badge bg-primary ms-1">{complaint.status}</span>
            </div>
          </div>
          <div className="col-md-4 text-center text-md-end mt-3 mt-md-0">
            {/* Stamp visual */}
            <div className="d-inline-block p-2 border border-2 border-dark text-center font-monospace bg-white" style={{ minWidth: '130px' }}>
              <div style={{ fontSize: '0.65rem' }} className="fw-bold text-uppercase border-bottom pb-1">
                E-VERIFIED SLIP
              </div>
              <div style={{ fontSize: '1.4rem' }} className="py-1">🏁 🇮🇳 🛡️</div>
              <div style={{ fontSize: '0.65rem' }} className="text-muted">
                {complaint.police_station_code || 'STN-VERIFIED'}
              </div>
            </div>
          </div>
        </div>

        {/* Complainant Details */}
        <h6 className="fw-bold text-navy border-bottom pb-2 mb-3" style={{ color: '#0b2545' }}>
          1. COMPLAINANT INFORMATION
        </h6>
        <div className="row g-2 mb-4 small">
          <div className="col-sm-6">
            <span className="text-muted">Full Name:</span>{' '}
            <strong className="text-dark">{complaint.citizen_name || 'Registered Citizen'}</strong>
          </div>
          <div className="col-sm-6">
            <span className="text-muted">Mobile Number:</span>{' '}
            <strong className="text-dark">{complaint.citizen_mobile || 'N/A'}</strong>
          </div>
          <div className="col-sm-6">
            <span className="text-muted">Email Address:</span>{' '}
            <strong className="text-dark">{complaint.citizen_email || 'N/A'}</strong>
          </div>
          <div className="col-sm-6">
            <span className="text-muted">Address:</span>{' '}
            <strong className="text-dark">
              {[complaint.citizen_address, complaint.citizen_city, complaint.citizen_state, complaint.citizen_pincode]
                .filter(Boolean)
                .join(', ') || 'On record with portal profile'}
            </strong>
          </div>
        </div>

        {/* Incident Details */}
        <h6 className="fw-bold text-navy border-bottom pb-2 mb-3" style={{ color: '#0b2545' }}>
          2. INCIDENT & POLICE STATION DETAILS
        </h6>
        <div className="row g-2 mb-4 small">
          <div className="col-sm-6">
            <span className="text-muted">Complaint Category:</span>{' '}
            <span className="badge bg-secondary">{complaint.category_name}</span>
          </div>
          <div className="col-sm-6">
            <span className="text-muted">Jurisdiction Station:</span>{' '}
            <strong className="text-primary">{complaint.station_name}</strong> ({complaint.station_code})
          </div>
          <div className="col-sm-6">
            <span className="text-muted">Date & Time of Incident:</span>{' '}
            <strong className="text-dark">
              {complaint.incident_date} {complaint.incident_time ? `at ${complaint.incident_time}` : ''}
            </strong>
          </div>
          <div className="col-sm-6">
            <span className="text-muted">Incident Location:</span>{' '}
            <strong className="text-dark">
              {complaint.incident_location}, {complaint.district}, {complaint.state} - {complaint.pincode}
            </strong>
          </div>
          <div className="col-12 mt-2">
            <span className="text-muted d-block mb-1">Incident Title:</span>
            <div className="p-2 bg-light rounded border fw-semibold">{complaint.title}</div>
          </div>
          <div className="col-12 mt-2">
            <span className="text-muted d-block mb-1">Brief Description of Grievance:</span>
            <div className="p-3 bg-light rounded border text-muted" style={{ whiteSpace: 'pre-wrap' }}>
              {complaint.description}
            </div>
          </div>
        </div>

        {/* FIR Details if already registered */}
        {complaint.fir_number && (
          <div className="alert alert-success border border-success p-3 mb-4">
            <div className="fw-bold text-success text-uppercase small mb-1">
              Official First Information Report (FIR) Registered
            </div>
            <div className="fs-5 fw-bold font-monospace text-dark">{complaint.fir_number}</div>
            <div className="small text-muted mt-1">
              Applicable Legal Sections: <span className="fw-semibold text-dark">{complaint.fir_sections || complaint.sections}</span>
            </div>
          </div>
        )}

        {/* Statutory Disclaimers */}
        <div className="p-3 bg-light rounded border text-muted small mb-4" style={{ fontSize: '0.78rem' }}>
          <strong>STATUTORY NOTICE:</strong>
          <ul className="mb-0 ps-3 mt-1">
            <li>
              This document serves as an electronic acknowledgement receipt under the Police IT Grievance Management System.
            </li>
            <li>
              In accordance with legal provisions, an online complaint undergoes preliminary officer verification before registration as a formal FIR.
            </li>
            <li>
              Providing false information or deceptive claims to a police authority is an offence punishable under Section 182 / 211 IPC and relevant sections of Bharatiya Nyaya Sanhita (BNS).
            </li>
            <li>
              You may track the status of this grievance anytime on the portal using the reference number above.
            </li>
          </ul>
        </div>

        {/* Footer Signatures */}
        <div className="row mt-5 pt-3 border-top align-items-end text-center">
          <div className="col-6">
            <div className="small text-muted mb-4">Signature of Complainant</div>
            <div className="border-top border-dark d-inline-block px-4 pt-1 small fw-bold">
              {complaint.citizen_name || 'Complainant (Digital Record)'}
            </div>
          </div>
          <div className="col-6">
            <div className="small text-muted mb-4">Station Duty Officer / Electronic Dispatch</div>
            <div className="border-top border-dark d-inline-block px-4 pt-1 small fw-bold">
              Station Electronic Seal & Authorizer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
