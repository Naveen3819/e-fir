import React, { useState } from 'react';
import { BsGear, BsShieldCheck, BsCpu, BsDatabaseCheck, BsRobot } from 'react-icons/bs';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
          Portal Configuration &amp; Architectural Specifications
        </h4>
        <p className="text-muted small mb-0">
          Environment security parameters, database connections, and Future AI extensibility roadmap.
        </p>
      </div>

      <div className="row g-4">
        {/* Navigation Tabs */}
        <div className="col-md-3">
          <div className="list-group shadow-sm">
            <button
              onClick={() => setActiveTab('general')}
              className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${
                activeTab === 'general' ? 'active' : ''
              }`}
            >
              <BsGear />
              <span>System Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${
                activeTab === 'security' ? 'active' : ''
              }`}
            >
              <BsShieldCheck />
              <span>Security Controls</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${
                activeTab === 'ai' ? 'active' : ''
              }`}
            >
              <BsRobot />
              <span>Future AI Extensions</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="col-md-9">
          {activeTab === 'general' && (
            <div className="gov-card shadow-sm p-4">
              <h5 className="fw-bold text-navy mb-3" style={{ color: '#0b2545' }}>
                System Architecture &amp; Environment
              </h5>

              <div className="table-responsive mb-4">
                <table className="table table-bordered small">
                  <tbody>
                    <tr>
                      <th className="table-light col-4">Application Title</th>
                      <td className="fw-semibold">E-FIR Management System (National Citizen Portal)</td>
                    </tr>
                    <tr>
                      <th className="table-light">Backend Technology</th>
                      <td>Node.js &amp; Express.js REST API Architecture</td>
                    </tr>
                    <tr>
                      <th className="table-light">Relational Database</th>
                      <td>
                        PostgreSQL with Relational Foreign Keys &amp; Embedded Persistent Engine
                      </td>
                    </tr>
                    <tr>
                      <th className="table-light">Frontend Framework</th>
                      <td>React.js (Vite) + Bootstrap 5 + Recharts Data Visualizations</td>
                    </tr>
                    <tr>
                      <th className="table-light">Authentication Model</th>
                      <td>JSON Web Tokens (JWT) + bcrypt Password Hashing (Salt Rounds: 10)</td>
                    </tr>
                    <tr>
                      <th className="table-light">File Storage Layer</th>
                      <td>
                        Dedicated Uploads Directory (Abstraction ready for AWS S3 Cloud Storage)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h6 className="fw-bold text-navy mb-2">Service Endpoints Health</h6>
              <div className="p-3 bg-light rounded border d-flex justify-content-between align-items-center small">
                <div>
                  <span className="badge bg-success me-2">ONLINE</span>
                  <span className="fw-semibold font-monospace">/api/health</span>
                </div>
                <span className="text-muted">Response: HTTP 200 OK</span>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="gov-card shadow-sm p-4">
              <h5 className="fw-bold text-navy mb-3" style={{ color: '#0b2545' }}>
                Portal Security &amp; Compliance Hardening
              </h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 border rounded bg-light h-100">
                    <h6 className="fw-bold text-primary mb-2">Authentication &amp; Access</h6>
                    <ul className="small text-muted ps-3 mb-0">
                      <li>Role-Based Access Control (RBAC: Citizen, Police, Admin)</li>
                      <li>Token expiration &amp; automatic unauthorized interceptors</li>
                      <li>No plain-text passwords stored anywhere in database</li>
                      <li>Granular permission gating per station jurisdiction</li>
                    </ul>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded bg-light h-100">
                    <h6 className="fw-bold text-primary mb-2">Evidence &amp; Network Defense</h6>
                    <ul className="small text-muted ps-3 mb-0">
                      <li>Cryptographic SHA-256 hash computed for all evidence</li>
                      <li>No direct public URLs exposed for uploaded evidence</li>
                      <li>Strict MIME type validation &amp; 50MB file size quotas</li>
                      <li>Express Rate Limiter preventing brute-force login attempts</li>
                      <li>Helmet HTTP security headers protection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="gov-card shadow-sm p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <BsRobot className="fs-3 text-primary" />
                <h5 className="fw-bold text-navy mb-0" style={{ color: '#0b2545' }}>
                  Future Artificial Intelligence (AI) Extension Architecture
                </h5>
              </div>

              <div className="alert alert-warning small mb-4">
                <strong>Statutory Guardrail:</strong> In strict compliance with police legal principles, AI services are designed strictly as an assistive layer (e.g. classification, extraction, translation). <strong>AI is NOT responsible for legal decisions, FIR approval, guilt determination, or judicial police action.</strong>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 border rounded bg-white shadow-sm h-100">
                    <span className="badge bg-primary mb-2">Module 1</span>
                    <h6 className="fw-bold text-dark">Complaint Classification &amp; Routing</h6>
                    <p className="small text-muted mb-0">
                      NLP transformer model to analyze citizen statements and automatically suggest appropriate crime categories (e.g. distinguishing between Theft vs Lost Documents or UPI scam vs Cyber extortion).
                    </p>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded bg-white shadow-sm h-100">
                    <span className="badge bg-primary mb-2">Module 2</span>
                    <h6 className="fw-bold text-dark">Grievance Executive Summarization</h6>
                    <p className="small text-muted mb-0">
                      Generates concise 3-bullet executive briefs for duty officers, highlighting essential facts: time, date, suspects, stolen asset value, and immediate witness contacts.
                    </p>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded bg-white shadow-sm h-100">
                    <span className="badge bg-primary mb-2">Module 3</span>
                    <h6 className="fw-bold text-dark">Duplicate Complaint Detection</h6>
                    <p className="small text-muted mb-0">
                      Semantic vector similarity search across past filings to flag potential duplicate complaints filed across multiple stations for the same incident.
                    </p>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded bg-white shadow-sm h-100">
                    <span className="badge bg-primary mb-2">Module 4</span>
                    <h6 className="fw-bold text-dark">Multilingual Citizen Assistance</h6>
                    <p className="small text-muted mb-0">
                      Real-time translation across 22 scheduled national languages, enabling citizens to file complaints in regional dialects with accurate transcription.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
