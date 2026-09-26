import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../api/client';
import {
  BsShieldCheck,
  BsFileEarmarkPlus,
  BsSearch,
  BsCheckCircle,
  BsArrowRight,
  BsShieldLock,
  BsLaptop,
  BsTelephoneFill,
  BsLockFill,
  BsFileText,
} from 'react-icons/bs';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [stations, setStations] = useState([]);

  useEffect(() => {
    api.get('/public/categories')
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => {});
    api.get('/public/stations')
      .then((res) => setStations(res.data.stations || []))
      .catch(() => {});
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      {/* Hero Section */}
      <section
        className="py-5 text-white position-relative"
        style={{
          background: 'linear-gradient(135deg, #06182e 0%, #0b2545 60%, #134074 100%)',
          borderBottom: '4px solid #d4af37',
        }}
      >
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-light bg-opacity-10 border border-light border-opacity-25 mb-3">
                <span className="badge bg-warning text-dark fw-bold">E-GOV 2026</span>
                <span className="small text-light">Official National Citizen Grievance Portal</span>
              </div>
              <h1 className="display-5 fw-bold mb-3" style={{ letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                Online Police Grievance &amp; <span className="text-warning">E-FIR Platform</span>
              </h1>
              <p className="lead text-light opacity-90 mb-4 fs-6">
                Submit eligible police complaints, upload digital evidence securely, track live investigation milestones, and receive instant departmental notifications without needing to wait in line at police stations.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Link to="/complaints/new" className="btn btn-warning btn-lg fw-bold px-4 py-2 d-flex align-items-center gap-2 shadow">
                  <BsFileEarmarkPlus className="fs-5" />
                  <span>File an E-Complaint</span>
                </Link>
                <Link to="/track" className="btn btn-outline-light btn-lg px-4 py-2 d-flex align-items-center gap-2">
                  <BsSearch />
                  <span>Track Status</span>
                </Link>
              </div>

              {/* Fast stats row */}
              <div className="row g-3 mt-4 pt-3 border-top border-light border-opacity-10 text-center text-sm-start">
                <div className="col-4">
                  <div className="fs-4 fw-bold text-warning font-monospace">24x7</div>
                  <div className="small text-light opacity-75">Digital Filing</div>
                </div>
                <div className="col-4">
                  <div className="fs-4 fw-bold text-warning font-monospace">100%</div>
                  <div className="small text-light opacity-75">Verified Workflow</div>
                </div>
                <div className="col-4">
                  <div className="fs-4 fw-bold text-warning font-monospace">SHA-256</div>
                  <div className="small text-light opacity-75">Evidence Integrity</div>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="gov-card shadow-lg border-0 p-4 bg-white text-dark rounded-3 position-relative">
                <div className="d-flex align-items-center gap-2 mb-3 text-primary">
                  <BsShieldCheck className="fs-3 text-warning" />
                  <h5 className="fw-bold mb-0 text-navy" style={{ color: '#0b2545' }}>
                    Quick Citizen Portal Access
                  </h5>
                </div>
                <p className="small text-muted mb-4">
                  Log in to submit complaints, manage case files, or review official departmental decisions.
                </p>

                <div className="d-grid gap-2">
                  <Link to="/login" className="btn btn-primary fw-semibold py-2">
                    Personnel &amp; Citizen Sign In
                  </Link>
                  <Link to="/register" className="btn btn-outline-secondary fw-semibold py-2">
                    Create New Citizen Account
                  </Link>
                </div>

                <div className="mt-4 pt-3 border-top">
                  <div className="small text-muted fw-bold text-uppercase mb-2">
                    Official Grievance Categories:
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {categories.slice(0, 6).map((cat) => (
                      <span key={cat.id} className="badge bg-light text-dark border small">
                        {cat.name}
                      </span>
                    ))}
                    {categories.length > 6 && (
                      <span className="badge bg-secondary small">+{categories.length - 6} more</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-5 bg-white">
        <div className="container py-2">
          <div className="text-center mb-5">
            <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-1 mb-2">
              TRANSPARENT WORKFLOW
            </span>
            <h2 className="fw-bold text-navy" style={{ color: '#0b2545' }}>
              How Online E-FIR Grievance Works
            </h2>
            <p className="text-muted col-md-8 mx-auto">
              Our structured multi-stage verification ensures that all submitted complaints receive prompt legal scrutiny from the designated police station authority before an official FIR is registered.
            </p>
          </div>

          <div className="row g-4 text-center">
            <div className="col-md-3">
              <div className="p-4 border rounded-3 bg-light h-100 position-relative">
                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold fs-4" style={{ width: '60px', height: '60px' }}>
                  1
                </div>
                <h5 className="fw-bold text-navy" style={{ color: '#0b2545' }}>1. Submit Complaint</h5>
                <p className="small text-muted mb-0">
                  Citizen enters incident facts, specifies date, time, location, and attaches digital evidence (images, docs, audio/video).
                </p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="p-4 border rounded-3 bg-light h-100 position-relative">
                <div className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold fs-4" style={{ width: '60px', height: '60px' }}>
                  2
                </div>
                <h5 className="fw-bold text-navy" style={{ color: '#0b2545' }}>2. Station Verification</h5>
                <p className="small text-muted mb-0">
                  Station officer inspects the grievance. The officer can verify, request additional documents, or reject with a formal recorded reason.
                </p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="p-4 border rounded-3 bg-light h-100 position-relative">
                <div className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold fs-4" style={{ width: '60px', height: '60px' }}>
                  3
                </div>
                <h5 className="fw-bold text-navy" style={{ color: '#0b2545' }}>3. FIR Registration</h5>
                <p className="small text-muted mb-0">
                  Upon verification of cognizable offences, the authorized police officer records a formal FIR with applicable legal sections and assigns an IO.
                </p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="p-4 border rounded-3 bg-light h-100 position-relative">
                <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold fs-4" style={{ width: '60px', height: '60px' }}>
                  4
                </div>
                <h5 className="fw-bold text-navy" style={{ color: '#0b2545' }}>4. Investigation &amp; Closure</h5>
                <p className="small text-muted mb-0">
                  Investigating officer logs case diary progress. Once resolved, the citizen downloads the final report and submits departmental feedback.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Police Stations Directory Section */}
      <section className="py-5 bg-light border-top">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
                Connected Police Stations
              </h3>
              <p className="text-muted small mb-0">
                Grievances are automatically directed to your jurisdiction station for immediate action.
              </p>
            </div>
            <Link to="/track" className="btn btn-outline-primary btn-sm">
              Check Jurisdiction
            </Link>
          </div>

          <div className="row g-3">
            {stations.map((stn) => (
              <div key={stn.id} className="col-md-6 col-lg-3">
                <div className="p-3 bg-white rounded border h-100 shadow-sm">
                  <span className="badge bg-secondary-subtle text-primary mb-2 font-monospace">
                    {stn.station_code}
                  </span>
                  <h6 className="fw-bold text-dark mb-1">{stn.station_name}</h6>
                  <p className="small text-muted mb-2">{stn.district}, {stn.state}</p>
                  <div className="small text-primary fw-semibold d-flex align-items-center gap-1">
                    <BsTelephoneFill /> {stn.contact_number}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
