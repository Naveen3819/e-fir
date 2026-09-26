import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function NotFound() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <div className="container py-5 my-auto text-center">
        <div className="fs-1 text-primary mb-3">🛡️ 404</div>
        <h3 className="fw-bold text-navy" style={{ color: '#0b2545' }}>
          Portal Resource Not Found
        </h3>
        <p className="text-muted small mb-4 col-md-6 mx-auto">
          The requested page or record could not be located on this portal. It may have been relocated or you might not have appropriate departmental authorization.
        </p>
        <Link to="/" className="btn btn-primary px-4 py-2">
          Return to Portal Home
        </Link>
      </div>

      <Footer />
    </div>
  );
}
