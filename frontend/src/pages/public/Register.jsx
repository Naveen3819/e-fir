import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { BsPersonPlus, BsShieldCheck } from 'react-icons/bs';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      password: formData.password,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
    });
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(result.message || 'Registration failed.');
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="gov-card shadow-sm">
              <div className="gov-card-header bg-light d-flex align-items-center gap-2">
                <BsPersonPlus className="fs-4 text-primary" />
                <div>
                  <h5 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                    Citizen Portal Registration
                  </h5>
                  <small className="text-muted">Create an account to submit complaints, upload evidence, and track FIRs</small>
                </div>
              </div>

              <div className="gov-card-body p-4">
                {errorMsg && (
                  <div className="alert alert-danger small py-2 mb-4">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">
                        Full Name (as per Govt ID) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">
                        Mobile Number (10 digits) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        className="form-control"
                        placeholder="e.g. 9876543210"
                        value={formData.mobile}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label small fw-bold text-secondary">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="e.g. ramesh@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      <div className="form-text small">
                        Case status updates and official communications will be sent to this email.
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">
                        Create Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Minimum 6 characters"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">
                        Confirm Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="form-control"
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-12 mt-4">
                      <h6 className="fw-bold text-navy border-bottom pb-2" style={{ color: '#0b2545' }}>
                        Residential Address Information
                      </h6>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-secondary">
                        House / Flat / Street Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        className="form-control"
                        placeholder="e.g. Flat 301, Sunshine Heights, MG Road"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">City / Town</label>
                      <input
                        type="text"
                        name="city"
                        className="form-control"
                        placeholder="e.g. New Delhi"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">State / UT</label>
                      <input
                        type="text"
                        name="state"
                        className="form-control"
                        placeholder="e.g. Delhi"
                        value={formData.state}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        className="form-control"
                        placeholder="e.g. 110001"
                        value={formData.pincode}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-12 mt-3">
                      <div className="form-check small text-muted">
                        <input className="form-check-input" type="checkbox" id="termsCheck" required />
                        <label className="form-check-label" htmlFor="termsCheck">
                          I declare that the information provided is accurate and authentic. I understand that submitting fraudulent or misleading reports is a punishable offence.
                        </label>
                      </div>
                    </div>

                    <div className="col-12 mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary w-100 py-2 fw-semibold shadow-sm"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                        ) : null}
                        Complete Registration &amp; Access Portal
                      </button>
                    </div>
                  </div>
                </form>

                <div className="text-center mt-4 pt-3 border-top small text-muted">
                  Already have an account?{' '}
                  <Link to="/login" className="fw-bold text-primary text-decoration-none">
                    Sign In
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
