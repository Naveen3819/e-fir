import React from 'react';
import { Link } from 'react-router-dom';
import { BsShieldLock, BsTelephoneFill, BsFileEarmarkCheck } from 'react-icons/bs';

export default function Footer() {
  return (
    <footer className="bg-dark text-light pt-4 pb-3 mt-auto border-top border-secondary border-opacity-25 no-print">
      <div className="container-fluid px-4">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <h6 className="text-warning fw-bold mb-3 d-flex align-items-center gap-2">
              <BsShieldLock /> E-FIR DIGITAL POLICE INITIATIVE
            </h6>
            <p className="small text-muted mb-2">
              An online citizen–police platform designed to provide transparent, responsive, and accountable grievance filing and FIR tracking without unnecessary visits to physical police stations.
            </p>
            <p className="small text-muted mb-0" style={{ fontSize: '0.78rem' }}>
              🔒 Secured with 256-bit encryption &amp; immutable audit logging.
            </p>
          </div>

          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3">Citizen Services</h6>
            <ul className="list-unstyled small text-muted mb-0">
              <li className="mb-2"><Link to="/complaints/new" className="text-muted text-decoration-none hover-white">Submit New Complaint</Link></li>
              <li className="mb-2"><Link to="/track" className="text-muted text-decoration-none hover-white">Track Grievance Status</Link></li>
              <li className="mb-2"><Link to="/login" className="text-muted text-decoration-none hover-white">Police Personnel Login</Link></li>
              <li className="mb-2"><Link to="/register" className="text-muted text-decoration-none hover-white">New Citizen Registration</Link></li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-6">
            <h6 className="text-white fw-bold mb-3">24x7 Helplines</h6>
            <ul className="list-unstyled small text-muted mb-0">
              <li className="mb-2"><span className="text-warning fw-bold">112</span> — Emergency Response</li>
              <li className="mb-2"><span className="text-warning fw-bold">1930</span> — National Cyber Crime</li>
              <li className="mb-2"><span className="text-warning fw-bold">1091</span> — Women Safety Desk</li>
              <li className="mb-2"><span className="text-warning fw-bold">1098</span> — Childline Support</li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3">Legal &amp; Statutory Notice</h6>
            <p className="small text-muted mb-1" style={{ fontSize: '0.78rem' }}>
              Submitting a complaint on this portal does not automatically generate a First Information Report (FIR). An FIR is registered only post verification by the designated police station authority.
            </p>
            <p className="small text-muted mb-0" style={{ fontSize: '0.78rem' }}>
              Filing malicious or fabricated complaints is punishable under IPC / BNS regulations.
            </p>
          </div>
        </div>

        <hr className="border-secondary border-opacity-50 my-3" />

        <div className="d-flex flex-wrap justify-content-between align-items-center small text-muted">
          <div>
            &copy; {new Date().getFullYear()} E-FIR Management System. All Rights Reserved. National Police Information Architecture.
          </div>
          <div className="d-flex gap-3 mt-2 mt-sm-0">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Hyperlinking Policy</span>
            <span>Security Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
