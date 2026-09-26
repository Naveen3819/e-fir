import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { BsPrinter, BsBarChart, BsDownload } from 'react-icons/bs';

export default function PoliceReports() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/police/dashboard')
      .then((res) => {
        if (res.data.success) {
          setDashboardData(res.data.stats);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 no-print">
        <div>
          <h4 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
            Station Grievance &amp; Investigation Reports
          </h4>
          <p className="text-muted small mb-0">
            Official departmental metrics for {user?.policeStationName || 'Station Headquarters'}.
          </p>
        </div>
        <button onClick={handlePrint} className="btn btn-outline-primary d-flex align-items-center gap-2">
          <BsPrinter />
          <span>Print / Export Report</span>
        </button>
      </div>

      <div className="official-document p-4 shadow-sm bg-white mb-4">
        <div className="text-center border-bottom pb-3 mb-4">
          <h4 className="fw-bold mb-1 text-navy" style={{ color: '#0b2545' }}>
            POLICE DEPARTMENT - STATION PERFORMANCE REPORT
          </h4>
          <p className="text-muted small mb-0">
            Jurisdiction: {user?.policeStationName} | Station Code: {user?.policeStationCode}
          </p>
          <small className="text-muted">Report Generated On: {new Date().toLocaleString()}</small>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : (
          <div>
            {/* Category breakdown table */}
            <h6 className="fw-bold text-navy border-bottom pb-2 mb-3" style={{ color: '#0b2545' }}>
              1. Grievance Distribution by Category
            </h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered table-sm small">
                <thead className="table-light">
                  <tr>
                    <th>Complaint Category</th>
                    <th className="text-center">Recorded Incidents</th>
                    <th className="text-end">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.byCategory?.map((cat, idx) => {
                    const totalComplaints = dashboardData.byCategory.reduce((acc, c) => acc + parseInt(c.count, 10), 0) || 1;
                    const pct = ((parseInt(cat.count, 10) / totalComplaints) * 100).toFixed(1);
                    return (
                      <tr key={idx}>
                        <td className="fw-semibold">{cat.name}</td>
                        <td className="text-center">{cat.count}</td>
                        <td className="text-end">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Status breakdown table */}
            <h6 className="fw-bold text-navy border-bottom pb-2 mb-3" style={{ color: '#0b2545' }}>
              2. Procedural Status Summary
            </h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered table-sm small">
                <thead className="table-light">
                  <tr>
                    <th>Workflow Stage</th>
                    <th className="text-center">Total Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.byStatus?.map((st, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold">{st.status}</td>
                      <td className="text-center font-monospace">{st.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row mt-5 pt-4 border-top text-center">
              <div className="col-6">
                <div className="small text-muted mb-4">Station Duty Officer Signature</div>
                <div className="d-inline-block border-top border-dark px-4 pt-1 fw-bold small">
                  {user?.name} ({user?.rank})
                </div>
              </div>
              <div className="col-6">
                <div className="small text-muted mb-4">Sub-Divisional Police Officer / SP Review</div>
                <div className="d-inline-block border-top border-dark px-4 pt-1 fw-bold small">
                  District Oversight Authority
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
