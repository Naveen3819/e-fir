import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { BsShieldLock, BsPersonFill, BsKeyFill, BsEye, BsEyeSlash } from 'react-icons/bs';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDemoFill = (roleType) => {
    setErrorMsg('');
    if (roleType === 'citizen') {
      setIdentifier('citizen@example.com');
      setPassword('Password@123');
    } else if (roleType === 'police') {
      setIdentifier('police@example.com');
      setPassword('Password@123');
    } else if (roleType === 'admin') {
      setIdentifier('admin@example.com');
      setPassword('Password@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const result = await login(identifier, password);
    setLoading(false);

    if (result.success) {
      if (result.user.role === 'police') {
        navigate('/police/dashboard');
      } else if (result.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setErrorMsg(result.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <div className="container py-5 my-auto">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-5">
            {/* Demo Quick-Fill Bar */}
            <div className="card shadow-sm border-0 mb-4 bg-navy text-white" style={{ backgroundColor: '#0b2545' }}>
              <div className="card-body p-3">
                <div className="small fw-bold text-warning text-uppercase mb-2">
                  Demo Fast Credentials (1-Click Fill):
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleDemoFill('citizen')}
                    className="btn btn-sm btn-outline-light flex-fill"
                  >
                    🧑 Citizen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoFill('police')}
                    className="btn btn-sm btn-outline-info flex-fill"
                  >
                    👮 Police Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoFill('admin')}
                    className="btn btn-sm btn-outline-warning flex-fill"
                  >
                    🛠️ Administrator
                  </button>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <div className="gov-card shadow-sm">
              <div className="gov-card-header text-center d-block py-3 bg-light">
                <div className="rounded-circle bg-primary bg-opacity-10 text-primary mx-auto mb-2 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <BsShieldLock className="fs-3 text-primary" />
                </div>
                <h5 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
                  Citizen &amp; Official Sign In
                </h5>
                <p className="text-muted small mb-0">Enter your registered email/mobile and password</p>
              </div>

              <div className="gov-card-body p-4">
                {errorMsg && (
                  <div className="alert alert-danger small py-2 d-flex align-items-center mb-3">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      Email Address or Mobile Number
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted">
                        <BsPersonFill />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. citizen@example.com or +91-9876543210"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-bold text-secondary mb-0">
                        Password
                      </label>
                      <Link to="/forgot-password" style={{ fontSize: '0.8rem' }} className="text-decoration-none">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted">
                        <BsKeyFill />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        placeholder="Enter your account password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <BsEyeSlash /> : <BsEye />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold mt-2 shadow-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                    ) : null}
                    Sign In to Portal
                  </button>
                </form>

                <div className="text-center mt-4 pt-3 border-top small text-muted">
                  Don't have a citizen account?{' '}
                  <Link to="/register" className="fw-bold text-primary text-decoration-none">
                    Register Here
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
