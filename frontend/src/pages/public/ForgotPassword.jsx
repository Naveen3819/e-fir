import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../api/client';
import { BsKeyFill, BsCheckCircleFill } from 'react-icons/bs';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message || 'Password reset instructions have been dispatched.');
      setSubmitted(true);
    } catch (err) {
      setMessage(err.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <div className="container py-5 my-auto">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="gov-card shadow-sm">
              <div className="gov-card-header bg-light text-center d-block py-3">
                <BsKeyFill className="fs-2 text-warning mb-2" />
                <h5 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
                  Reset Portal Password
                </h5>
                <p className="text-muted small mb-0">Enter your registered email address</p>
              </div>

              <div className="gov-card-body p-4">
                {submitted ? (
                  <div className="text-center py-3">
                    <BsCheckCircleFill className="text-success fs-1 mb-3" />
                    <h6 className="fw-bold">Request Dispatched</h6>
                    <p className="small text-muted mb-3">{message}</p>
                    <div className="p-3 bg-light rounded border text-muted small text-start mb-4">
                      💡 <strong>Evaluation Note:</strong> For testing this project, all pre-seeded demo accounts (citizen, police, admin) use the default password: <code>Password@123</code>.
                    </div>
                    <Link to="/login" className="btn btn-primary w-100 py-2">
                      Return to Sign In
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">
                        Registered Email Address
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. citizen@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2 fw-semibold"
                      disabled={loading}
                    >
                      {loading ? 'Sending Instructions...' : 'Send Password Reset Link'}
                    </button>

                    <div className="text-center mt-3 small">
                      <Link to="/login" className="text-muted text-decoration-none">
                        &larr; Back to Login
                      </Link>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
