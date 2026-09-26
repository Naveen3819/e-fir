import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { toast } from 'react-toastify';
import { BsPersonCheck, BsKeyFill, BsShieldCheck } from 'react-icons/bs';

export default function CitizenProfile() {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', profileData);
      if (res.data.success) {
        toast.success('Profile updated successfully.');
        updateUser(res.data.user);
      }
    } catch (err) {
      toast.error(err.message || 'Error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setChangingPass(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      if (res.data.success) {
        toast.success('Password changed successfully.');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.message || 'Error changing password.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
          My Account Profile
        </h4>
        <p className="text-muted small mb-0">
          Manage your personal contact details, residential address, and account security credentials.
        </p>
      </div>

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-lg-7">
          <div className="gov-card shadow-sm h-100">
            <div className="gov-card-header bg-light d-flex align-items-center gap-2">
              <BsPersonCheck className="fs-5 text-primary" />
              <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                Personal &amp; Contact Information
              </h6>
            </div>

            <div className="gov-card-body p-4">
              <form onSubmit={handleProfileSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Email Address</label>
                    <input
                      type="email"
                      className="form-control bg-light"
                      value={user?.email || ''}
                      readOnly
                    />
                    <div className="form-text small">Email cannot be changed directly</div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Contact Mobile</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={profileData.mobile}
                      onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Portal Role</label>
                    <div className="p-2 bg-light rounded border small fw-bold text-uppercase text-primary">
                      {user?.role} Account
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold text-secondary">Residential Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-secondary">City</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-secondary">State</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileData.state}
                      onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-secondary">Pincode</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileData.pincode}
                      onChange={(e) => setProfileData({ ...profileData, pincode: e.target.value })}
                    />
                  </div>

                  <div className="col-12 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary px-4 fw-semibold"
                      disabled={savingProfile}
                    >
                      {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="col-lg-5">
          <div className="gov-card shadow-sm h-100">
            <div className="gov-card-header bg-light d-flex align-items-center gap-2">
              <BsKeyFill className="fs-5 text-warning" />
              <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
                Change Password
              </h6>
            </div>

            <div className="gov-card-body p-4">
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter current password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Minimum 6 characters"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Re-type new password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-outline-primary w-100 fw-semibold mt-2"
                  disabled={changingPass}
                >
                  {changingPass ? 'Updating...' : 'Update Password'}
                </button>
              </form>

              <div className="mt-4 p-3 bg-light rounded border small text-muted">
                <strong>Password Policy:</strong> Use minimum 6 characters. Do not share credentials or OTPs with anyone.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
