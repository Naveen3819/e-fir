import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import { BsTag, BsPlusCircle, BsCheckCircle, BsXCircle } from 'react-icons/bs';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories');
      if (res.data.success) {
        setCategories(res.data.categories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setShowModal(true);
  };

  const handleToggleStatus = async (cat) => {
    const nextStatus = cat.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.put(`/admin/categories/${cat.id}`, { status: nextStatus });
      if (res.data.success) {
        toast.success(`Category "${cat.name}" marked as ${nextStatus}.`);
        fetchCategories();
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editingCategory) {
        const res = await api.put(`/admin/categories/${editingCategory.id}`, { name, description });
        if (res.data.success) {
          toast.success('Category updated successfully.');
          setShowModal(false);
          fetchCategories();
        }
      } else {
        const res = await api.post('/admin/categories', { name, description });
        if (res.data.success) {
          toast.success('New category added successfully.');
          setShowModal(false);
          fetchCategories();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Error saving category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
            Complaint Categories Master
          </h4>
          <p className="text-muted small mb-0">
            Define legal grievance heads, categorization standards, and active complaint classifications.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn btn-primary d-flex align-items-center gap-2 fw-semibold shadow-sm"
        >
          <BsPlusCircle />
          <span>Add Grievance Category</span>
        </button>
      </div>

      <div className="gov-card shadow-sm">
        <div className="gov-card-header bg-light d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <BsTag className="text-primary fs-5" />
            <h6 className="mb-0 fw-bold text-navy" style={{ color: '#0b2545' }}>
              Configured Categories ({categories.length})
            </h6>
          </div>
        </div>

        <div className="gov-card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="small text-muted mt-2">Loading categories...</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light text-muted text-uppercase">
                  <tr>
                    <th className="ps-4">Category Name</th>
                    <th>Description</th>
                    <th className="text-center">Recorded Grievances</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="ps-4 fw-bold text-dark">{c.name}</td>
                      <td className="text-muted col-5">{c.description || 'N/A'}</td>
                      <td className="text-center font-monospace fw-bold">{c.complaint_count || 0}</td>
                      <td>
                        <span
                          className={`badge ${
                            c.status === 'active' ? 'bg-success' : 'bg-secondary'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="btn btn-outline-primary btn-sm me-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`btn btn-sm ${
                            c.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'
                          }`}
                        >
                          {c.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-navy text-white" style={{ backgroundColor: '#0b2545' }}>
                <h5 className="modal-title fw-bold">
                  {editingCategory ? 'Edit Complaint Category' : 'Add New Category'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      Category Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Cyber Crime or Financial Fraud"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      Description &amp; Scope of Offences
                    </label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Brief legal description to guide citizens during grievance submission..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm fw-bold px-4" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
