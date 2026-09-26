import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { toast } from 'react-toastify';
import { BsBell, BsCheck2All, BsEnvelopeOpen, BsArrowRight } from 'react-icons/bs';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notif) => {
    try {
      await api.put(`/notifications/${notif.id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (e) {
      toast.error('Failed to mark notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch (e) {
      toast.error('Failed to update notifications');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
            System Notifications Center
          </h4>
          <p className="text-muted small mb-0">
            Real-time status alerts, verification notices, information requests, and case updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
          >
            <BsCheck2All />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      <div className="gov-card shadow-sm">
        <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <BsBell className="text-primary fs-5" />
            <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
              Your Notification Feed ({notifications.length})
            </h6>
          </div>
        </div>

        <div className="gov-card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="small text-muted mt-2">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5 text-muted small">
              <div className="fs-1 text-muted mb-2">🔔</div>
              <h6 className="fw-bold text-secondary">No Notifications</h6>
              <p className="mb-0">You have no new notifications on the portal.</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n)}
                  className={`list-group-item list-group-item-action p-3 d-flex justify-content-between align-items-center ${
                    !n.is_read ? 'bg-light border-start border-4 border-primary' : ''
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="me-3">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span
                        className={`badge ${
                          n.type === 'success'
                            ? 'bg-success'
                            : n.type === 'warning'
                            ? 'bg-warning text-dark'
                            : n.type === 'alert'
                            ? 'bg-danger'
                            : 'bg-primary'
                        }`}
                        style={{ fontSize: '0.68rem' }}
                      >
                        {n.type || 'NOTICE'}
                      </span>
                      {!n.is_read && (
                        <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.62rem' }}>
                          NEW
                        </span>
                      )}
                      <small className="text-muted">
                        {new Date(n.created_at).toLocaleString()}
                      </small>
                    </div>
                    <div className={`text-dark small ${!n.is_read ? 'fw-bold' : ''}`}>
                      {n.message}
                    </div>
                  </div>

                  {n.link && (
                    <span className="btn btn-outline-primary btn-sm flex-shrink-0 d-flex align-items-center gap-1">
                      <span>View</span>
                      <BsArrowRight />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
