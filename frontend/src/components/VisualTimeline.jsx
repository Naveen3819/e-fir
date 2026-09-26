import React from 'react';
import { BsCheck, BsX, BsClock, BsHourglassSplit, BsShieldCheck } from 'react-icons/bs';

const standardSteps = [
  { key: 'Submitted', label: 'Submitted' },
  { key: 'Under Verification', label: 'Under Verification' },
  { key: 'Accepted', label: 'Accepted' },
  { key: 'FIR Registered', label: 'FIR Registered' },
  { key: 'Under Investigation', label: 'Investigation' },
  { key: 'Resolved', label: 'Resolved / Closed' },
];

export default function VisualTimeline({ currentStatus, updates = [], createdAt }) {
  const isRejected = currentStatus === 'Rejected';
  const isInfoRequired = currentStatus === 'Information Required';

  const getStepIndex = (status) => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'Under Verification':
      case 'Information Required':
        return 1;
      case 'Accepted':
        return 2;
      case 'FIR Registered':
      case 'Assigned':
        return 3;
      case 'Under Investigation':
        return 4;
      case 'Resolved':
      case 'Closed':
        return 5;
      default:
        return 0;
    }
  };

  const currentIndex = isRejected ? -1 : getStepIndex(currentStatus);

  return (
    <div className="py-3">
      {isRejected && (
        <div className="alert alert-danger d-flex align-items-center mb-4">
          <BsX className="fs-3 me-2" />
          <div>
            <strong>Complaint Rejected:</strong> This complaint did not meet verification criteria or falls outside station jurisdiction.
          </div>
        </div>
      )}

      {isInfoRequired && (
        <div className="alert alert-warning d-flex align-items-center mb-4">
          <BsHourglassSplit className="fs-3 me-2" />
          <div>
            <strong>Information Requested by Police:</strong> The investigating officer requires additional details/documents to proceed.
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between position-relative timeline-container px-2">
        {standardSteps.map((step, idx) => {
          const isDone = !isRejected && idx <= currentIndex;
          const isCurrent = !isRejected && idx === currentIndex;

          return (
            <div
              key={step.key}
              className="text-center position-relative flex-fill"
              style={{ zIndex: 2 }}
            >
              <div
                className={`mx-auto rounded-circle d-flex align-items-center justify-content-center mb-2 shadow-sm ${
                  isCurrent
                    ? 'bg-primary text-white border border-3 border-light'
                    : isDone
                    ? 'bg-success text-white'
                    : 'bg-light text-muted border'
                }`}
                style={{
                  width: '36px',
                  height: '36px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                }}
              >
                {isDone ? <BsCheck className="fs-4" /> : idx + 1}
              </div>
              <div
                className={`small ${
                  isCurrent
                    ? 'fw-bold text-primary'
                    : isDone
                    ? 'fw-semibold text-dark'
                    : 'text-muted'
                }`}
                style={{ fontSize: '0.78rem' }}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress line */}
      <div
        className="w-100 bg-secondary bg-opacity-25 position-relative"
        style={{ height: '3px', marginTop: '-36px', zIndex: 1, marginBottom: '45px' }}
      >
        <div
          className="bg-success h-100 transition-all"
          style={{
            width: isRejected
              ? '15%'
              : `${Math.min(100, Math.max(0, (currentIndex / (standardSteps.length - 1)) * 100))}%`,
          }}
        />
      </div>

      {/* Real-time Audit / Update Log in Timeline */}
      {updates.length > 0 && (
        <div className="mt-4 pt-3 border-top">
          <h6 className="fw-bold text-navy mb-3">Investigation Milestones & Progress Log</h6>
          <div className="timeline-feed ps-3 border-start border-2 border-primary">
            {updates.map((up) => (
              <div key={up.id} className="mb-3 position-relative ps-3">
                <div
                  className="position-absolute bg-primary rounded-circle"
                  style={{ width: '10px', height: '10px', left: '-21px', top: '5px' }}
                />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="badge bg-secondary-subtle text-primary border">
                    {up.update_type}
                  </span>
                  <small className="text-muted">
                    {new Date(up.created_at).toLocaleString()}
                  </small>
                </div>
                <p className="mb-1 text-dark small mt-1">{up.description}</p>
                {up.officer_name && (
                  <small className="text-muted fst-italic">
                    Logged by: {up.officer_rank} {up.officer_name} (Badge: {up.employee_id})
                  </small>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
