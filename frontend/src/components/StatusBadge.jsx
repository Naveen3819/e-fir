import React from 'react';
import {
  BsCheckCircleFill,
  BsClockFill,
  BsExclamationCircleFill,
  BsXCircleFill,
  BsShieldCheck,
  BsSearch,
} from 'react-icons/bs';

const statusMap = {
  'Submitted': { className: 'status-submitted', icon: <BsClockFill /> },
  'Under Verification': { className: 'status-under-verification', icon: <BsSearch /> },
  'Information Required': { className: 'status-information-required', icon: <BsExclamationCircleFill /> },
  'Accepted': { className: 'status-accepted', icon: <BsCheckCircleFill /> },
  'FIR Registered': { className: 'status-fir-registered', icon: <BsShieldCheck /> },
  'Assigned': { className: 'status-assigned', icon: <BsClockFill /> },
  'Under Investigation': { className: 'status-under-investigation', icon: <BsSearch /> },
  'Resolved': { className: 'status-resolved', icon: <BsCheckCircleFill /> },
  'Closed': { className: 'status-closed', icon: <BsCheckCircleFill /> },
  'Rejected': { className: 'status-rejected', icon: <BsXCircleFill /> },
};

export default function StatusBadge({ status }) {
  const config = statusMap[status] || {
    className: 'status-submitted',
    icon: <BsClockFill />,
  };

  return (
    <span className={`badge-status ${config.className}`}>
      {config.icon}
      <span>{status || 'Unknown'}</span>
    </span>
  );
}
