import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import AcknowledgementSlip from '../../components/AcknowledgementSlip';
import { toast } from 'react-toastify';
import {
  BsFileEarmarkText,
  BsPersonCheck,
  BsPaperclip,
  BsCheck2Circle,
  BsArrowRight,
  BsArrowLeft,
  BsTrash,
  BsPrinter,
  BsShieldCheck,
} from 'react-icons/bs';

export default function SubmitComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [incidentData, setIncidentData] = useState({
    categoryId: '',
    policeStationId: '',
    title: '',
    description: '',
    incidentDate: '',
    incidentTime: '',
    incidentLocation: '',
    district: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
  });

  const [complainantData, setComplainantData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    address: user?.address || '',
  });

  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidencePreviews, setEvidencePreviews] = useState([]);

  // Submission Result
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  useEffect(() => {
    // Load categories & stations
    api.get('/public/categories')
      .then((res) => {
        setCategories(res.data.categories || []);
        if (res.data.categories?.length > 0) {
          setIncidentData((prev) => ({ ...prev, categoryId: res.data.categories[0].id }));
        }
      })
      .catch(() => {});

    api.get('/public/stations')
      .then((res) => {
        setStations(res.data.stations || []);
        if (res.data.stations?.length > 0) {
          setIncidentData((prev) => ({ ...prev, policeStationId: res.data.stations[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  const handleIncidentChange = (e) => {
    setIncidentData({ ...incidentData, [e.target.name]: e.target.value });
  };

  const handleComplainantChange = (e) => {
    setComplainantData({ ...complainantData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;

    // Validate size (50MB max per file)
    const validFiles = [];
    const previews = [];

    for (const file of selected) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds the 50MB limit.`);
        continue;
      }
      validFiles.push(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        previews.push({
          name: file.name,
          url: URL.createObjectURL(file),
          type: 'image',
          size: (file.size / 1024 / 1024).toFixed(2),
        });
      } else {
        previews.push({
          name: file.name,
          url: null,
          type: file.type,
          size: (file.size / 1024 / 1024).toFixed(2),
        });
      }
    }

    setEvidenceFiles((prev) => [...prev, ...validFiles]);
    setEvidencePreviews((prev) => [...prev, ...previews]);
  };

  const removeFile = (index) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
    setEvidencePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Step Navigations
  const goToNext = (e) => {
    if (e) e.preventDefault();
    if (step === 1) {
      if (
        !incidentData.categoryId ||
        !incidentData.policeStationId ||
        !incidentData.title ||
        !incidentData.description ||
        !incidentData.incidentDate ||
        !incidentData.incidentLocation
      ) {
        toast.warn('Please fill in all mandatory incident details.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitComplaint = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('categoryId', incidentData.categoryId);
      formData.append('policeStationId', incidentData.policeStationId);
      formData.append('title', incidentData.title);
      formData.append('description', incidentData.description);
      formData.append('incidentDate', incidentData.incidentDate);
      formData.append('incidentTime', incidentData.incidentTime);
      formData.append('incidentLocation', incidentData.incidentLocation);
      formData.append('district', incidentData.district);
      formData.append('state', incidentData.state);
      formData.append('pincode', incidentData.pincode);

      // Append evidence files
      evidenceFiles.forEach((file) => {
        formData.append('evidenceFiles', file);
      });

      const res = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setSubmittedComplaint(res.data.complaint);
        setStep(5);
        toast.success('Complaint submitted successfully!');
      } else {
        toast.error(res.data.message || 'Submission failed.');
      }
    } catch (err) {
      toast.error(err.message || 'Error submitting complaint.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((c) => String(c.id) === String(incidentData.categoryId));
  const selectedStation = stations.find((s) => String(s.id) === String(incidentData.policeStationId));

  return (
    <div>
      <div className="gov-card p-4 shadow-sm mb-4">
        <h4 className="fw-bold text-navy mb-1" style={{ color: '#0b2545' }}>
          File Electronic Complaint / E-FIR Request
        </h4>
        <p className="text-muted small mb-4">
          Please provide comprehensive and truthful incident details. False or fabricated claims are punishable under law.
        </p>

        {/* Wizard Steps Header */}
        <div className="wizard-steps no-print">
          <div className={`wizard-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="wizard-step-circle">1</div>
            <div className="wizard-step-title">Incident Details</div>
          </div>
          <div className={`wizard-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="wizard-step-circle">2</div>
            <div className="wizard-step-title">Complainant Info</div>
          </div>
          <div className={`wizard-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="wizard-step-circle">3</div>
            <div className="wizard-step-title">Evidence Upload</div>
          </div>
          <div className={`wizard-step ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
            <div className="wizard-step-circle">4</div>
            <div className="wizard-step-title">Review &amp; Confirm</div>
          </div>
          <div className={`wizard-step ${step === 5 ? 'active completed' : ''}`}>
            <div className="wizard-step-circle">5</div>
            <div className="wizard-step-title">Acknowledgment</div>
          </div>
        </div>

        {/* STEP 1: Incident Information */}
        {step === 1 && (
          <form onSubmit={goToNext}>
            <h5 className="fw-bold text-navy border-bottom pb-2 mb-3" style={{ color: '#0b2545' }}>
              Step 1: Incident Information
            </h5>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold text-secondary">
                  Complaint Category <span className="text-danger">*</span>
                </label>
                <select
                  name="categoryId"
                  className="form-select"
                  value={incidentData.categoryId}
                  onChange={handleIncidentChange}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {selectedCategory?.description && (
                  <div className="form-text small text-muted">{selectedCategory.description}</div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-secondary">
                  Jurisdiction Police Station <span className="text-danger">*</span>
                </label>
                <select
                  name="policeStationId"
                  className="form-select"
                  value={incidentData.policeStationId}
                  onChange={handleIncidentChange}
                  required
                >
                  {stations.map((stn) => (
                    <option key={stn.id} value={stn.id}>
                      {stn.station_name} ({stn.district}, {stn.state})
                    </option>
                  ))}
                </select>
                <div className="form-text small text-muted">
                  Complaint will be assigned to this station for verification.
                </div>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold text-secondary">
                  Incident Title / Subject <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  placeholder="e.g. Theft of laptop & backpack from vehicle outside metro station"
                  value={incidentData.title}
                  onChange={handleIncidentChange}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold text-secondary">
                  Detailed Description of the Incident <span className="text-danger">*</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  className="form-control"
                  placeholder="Provide chronological sequence of events, serial numbers of stolen property, suspect descriptions, financial transaction references, etc."
                  value={incidentData.description}
                  onChange={handleIncidentChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-secondary">
                  Date of Incident <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  name="incidentDate"
                  className="form-control"
                  value={incidentData.incidentDate}
                  onChange={handleIncidentChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-secondary">
                  Approximate Time of Incident
                </label>
                <input
                  type="time"
                  name="incidentTime"
                  className="form-control"
                  value={incidentData.incidentTime}
                  onChange={handleIncidentChange}
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold text-secondary">
                  Specific Incident Location <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="incidentLocation"
                  className="form-control"
                  placeholder="e.g. Outer Circle, Gate 2 parking lot, Connaught Place"
                  value={incidentData.incidentLocation}
                  onChange={handleIncidentChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold text-secondary">District <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="district"
                  className="form-control"
                  value={incidentData.district}
                  onChange={handleIncidentChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold text-secondary">State / UT <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="state"
                  className="form-control"
                  value={incidentData.state}
                  onChange={handleIncidentChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold text-secondary">Pincode <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="pincode"
                  className="form-control"
                  value={incidentData.pincode}
                  onChange={handleIncidentChange}
                  required
                />
              </div>
            </div>

            <div className="d-flex justify-content-end mt-4 pt-3 border-top">
              <button type="submit" className="btn btn-primary d-flex align-items-center gap-2">
                <span>Continue to Complainant Info</span>
                <BsArrowRight />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Complainant Information */}
        {step === 2 && (
          <div>
            <h5 className="fw-bold text-navy border-bottom pb-2 mb-3" style={{ color: '#0b2545' }}>
              Step 2: Complainant Information Verification
            </h5>
            <p className="text-muted small mb-4">
              Your registered portal profile information is displayed below. Verify and update contact details if needed.
            </p>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold text-secondary">Complainant Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control bg-light"
                  value={complainantData.name}
                  onChange={handleComplainantChange}
                  readOnly
                />
                <div className="form-text small">Registered legal identity</div>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-secondary">Contact Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  className="form-control"
                  value={complainantData.mobile}
                  onChange={handleComplainantChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-secondary">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-control bg-light"
                  value={complainantData.email}
                  readOnly
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-secondary">Current Residential Address</label>
                <input
                  type="text"
                  name="address"
                  className="form-control"
                  value={complainantData.address}
                  onChange={handleComplainantChange}
                />
              </div>
            </div>

            <div className="d-flex justify-content-between mt-4 pt-3 border-top">
              <button type="button" onClick={goToBack} className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <BsArrowLeft />
                <span>Back</span>
              </button>
              <button type="button" onClick={goToNext} className="btn btn-primary d-flex align-items-center gap-2">
                <span>Continue to Evidence Upload</span>
                <BsArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Evidence Upload */}
        {step === 3 && (
          <div>
            <h5 className="fw-bold text-navy border-bottom pb-2 mb-3" style={{ color: '#0b2545' }}>
              Step 3: Upload Supporting Digital Evidence
            </h5>
            <p className="text-muted small mb-3">
              Attach photographs, bills, purchase receipts, screenshots, bank statements, CCTV clips, or identity proofs (Max 50MB per file; Images, PDF, Word documents, Audio, Video allowed).
            </p>

            <div className="border border-2 border-dashed p-4 text-center rounded bg-light mb-4">
              <BsPaperclip className="fs-1 text-primary mb-2" />
              <h6 className="fw-bold text-navy">Choose Evidence Files from Device</h6>
              <p className="small text-muted mb-3">
                Multiple files can be attached. Cryptographic SHA-256 hashes will be computed for chain of custody.
              </p>
              <label className="btn btn-outline-primary btn-sm px-4">
                Browse Files
                <input
                  type="file"
                  multiple
                  className="d-none"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* Uploaded File Previews */}
            {evidencePreviews.length > 0 && (
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-3">Attached Evidence ({evidencePreviews.length})</h6>
                <div className="row g-3">
                  {evidencePreviews.map((f, idx) => (
                    <div key={idx} className="col-md-6 col-lg-4">
                      <div className="p-3 bg-white rounded border d-flex align-items-center justify-content-between shadow-sm">
                        <div className="d-flex align-items-center gap-2 text-truncate me-2">
                          {f.type === 'image' && f.url ? (
                            <img
                              src={f.url}
                              alt="preview"
                              className="rounded border"
                              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="rounded bg-primary bg-opacity-10 text-primary p-2">
                              📄
                            </div>
                          )}
                          <div className="text-truncate">
                            <div className="small fw-semibold text-truncate">{f.name}</div>
                            <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                              {f.size} MB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="btn btn-outline-danger btn-sm p-1"
                          title="Remove file"
                        >
                          <BsTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between mt-4 pt-3 border-top">
              <button type="button" onClick={goToBack} className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <BsArrowLeft />
                <span>Back</span>
              </button>
              <button type="button" onClick={goToNext} className="btn btn-primary d-flex align-items-center gap-2">
                <span>Continue to Review</span>
                <BsArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review and Submit */}
        {step === 4 && (
          <div>
            <h5 className="fw-bold text-navy border-bottom pb-2 mb-3" style={{ color: '#0b2545' }}>
              Step 4: Review All Incident Information
            </h5>
            <p className="text-muted small mb-4">
              Please carefully review the summary before final submission. Once submitted, your grievance is forwarded to the designated station officer.
            </p>

            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <div className="p-3 bg-light rounded border h-100">
                  <h6 className="fw-bold text-primary mb-3">Incident Summary</h6>
                  <div className="small mb-2">
                    <span className="text-muted">Category:</span>{' '}
                    <strong className="text-dark">{selectedCategory?.name}</strong>
                  </div>
                  <div className="small mb-2">
                    <span className="text-muted">Police Station:</span>{' '}
                    <strong className="text-dark">{selectedStation?.station_name}</strong>
                  </div>
                  <div className="small mb-2">
                    <span className="text-muted">Date &amp; Time:</span>{' '}
                    <span className="text-dark">
                      {incidentData.incidentDate} {incidentData.incidentTime ? `at ${incidentData.incidentTime}` : ''}
                    </span>
                  </div>
                  <div className="small mb-2">
                    <span className="text-muted">Location:</span>{' '}
                    <span className="text-dark">
                      {incidentData.incidentLocation}, {incidentData.district}, {incidentData.state} - {incidentData.pincode}
                    </span>
                  </div>
                  <div className="small mt-2 pt-2 border-top">
                    <span className="text-muted fw-bold d-block">Title:</span>
                    <div className="fw-semibold text-dark">{incidentData.title}</div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 bg-light rounded border h-100">
                  <h6 className="fw-bold text-primary mb-3">Complainant &amp; Evidence</h6>
                  <div className="small mb-2">
                    <span className="text-muted">Complainant:</span>{' '}
                    <strong className="text-dark">{complainantData.name}</strong>
                  </div>
                  <div className="small mb-2">
                    <span className="text-muted">Mobile:</span>{' '}
                    <span className="text-dark">{complainantData.mobile}</span>
                  </div>
                  <div className="small mb-2">
                    <span className="text-muted">Email:</span>{' '}
                    <span className="text-dark">{complainantData.email}</span>
                  </div>
                  <div className="small mb-2">
                    <span className="text-muted">Evidence Files Attached:</span>{' '}
                    <span className="badge bg-secondary ms-1">{evidenceFiles.length} file(s)</span>
                  </div>
                  <div className="small mt-2 pt-2 border-top">
                    <span className="text-muted fw-bold d-block">Description:</span>
                    <div className="text-muted small" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                      {incidentData.description}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-warning bg-opacity-10 border border-warning rounded mb-4 small text-dark">
              <strong>Notice:</strong> Submitting an online complaint initiates a verification process. It does not automatically register an FIR until the police officer examines the cognizable nature of the offence.
            </div>

            <div className="d-flex justify-content-between mt-4 pt-3 border-top">
              <button type="button" onClick={goToBack} className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <BsArrowLeft />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSubmitComplaint}
                className="btn btn-success fw-bold px-4 py-2 d-flex align-items-center gap-2 shadow"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <BsCheck2Circle className="fs-5" />
                )}
                <span>Confirm &amp; Submit Complaint</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Success & Printable Acknowledgment */}
        {step === 5 && submittedComplaint && (
          <div>
            <div className="text-center py-4 bg-light rounded border mb-4 no-print">
              <div className="rounded-circle bg-success text-white d-inline-flex p-3 mb-3">
                <BsCheck2Circle className="fs-1" />
              </div>
              <h4 className="fw-bold text-navy" style={{ color: '#0b2545' }}>
                Complaint Submitted Successfully!
              </h4>
              <p className="text-muted small mb-2">
                Your electronic grievance has been recorded and assigned reference number:
              </p>
              <div className="fs-3 fw-bold font-monospace text-primary mb-3">
                {submittedComplaint.complaint_number}
              </div>
              <div className="d-flex justify-content-center gap-2">
                <Link to="/complaints" className="btn btn-outline-primary btn-sm">
                  View My Complaints
                </Link>
                <Link to={`/complaints/${submittedComplaint.id}`} className="btn btn-primary btn-sm">
                  Track Case Detail
                </Link>
              </div>
            </div>

            {/* Official Electronic Acknowledgment Slip */}
            <AcknowledgementSlip
              complaint={{
                ...submittedComplaint,
                citizen_name: complainantData.name,
                citizen_mobile: complainantData.mobile,
                citizen_email: complainantData.email,
                citizen_address: complainantData.address,
                category_name: selectedCategory?.name,
                station_name: selectedStation?.station_name,
                station_code: selectedStation?.station_code,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
