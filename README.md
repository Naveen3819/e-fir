# 🛡️ E-FIR Management System
### *National Online Citizen–Police Platform & Statutory FIR Portal*

[![Full-Stack Web App](https://img.shields.io/badge/Full--Stack-Node.js%20%7C%20Express%20%7C%20React-blue)](http://localhost:5000)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)](file:///database/schema.sql)
[![Build & Test](https://img.shields.io/badge/Automated%20Tests-14%2F14%20Passing-brightgreen)](file:///backend/test.js)

---

## 1. Project Overview

**E-FIR Management System** is a production-grade online citizen–police platform designed to allow citizens to file police complaints online, upload digital evidence, track grievance progression in real time, receive automated departmental notifications, and communicate directly with police officers without unnecessarily visiting a physical police station.

> **Statutory Safeguard Notice:** An online complaint/grievance submitted by a citizen does **NOT** automatically become an official First Information Report (FIR). The system enforces a mandatory police scrutiny and verification workflow before an authorized police officer can record an official FIR with applicable legal sections under IPC / BNS regulations.

---

## 2. Key Features by User Role

### 🧑 Citizen Module
* **Registration & Auth**: Register with Name, Mobile, Email, Address, City, State, Pincode. JWT authentication with bcrypt password hashing.
* **Multi-Step Complaint Submission**:
  * Step 1: Incident details (category, title, detailed narrative, date, time, location, pincode, police station selection).
  * Step 2: Complainant details verification.
  * Step 3: Digital evidence upload with MIME validation, 50MB file limit, and cryptographic SHA-256 integrity calculation.
  * Step 4: Review and statutory declaration confirmation.
  * Step 5: Instant generation of unique reference number (e.g. `E-FIR-2026-000101`) and printable official **Electronic Acknowledgment Slip**.
* **Visual Status Timeline**: Interactive progression timeline tracking case stages (`Submitted` &rarr; `Under Verification` &rarr; `Information Required` &rarr; `Accepted` &rarr; `FIR Registered` &rarr; `Under Investigation` &rarr; `Resolved` &rarr; `Closed`).
* **Information Request Response**: Directly respond to officer inquiries and upload requested additional documents.
* **Public Tracking**: Track grievance status using reference number without needing login.
* **Citizen Feedback**: Post-resolution 5-star rating and departmental feedback.

### 👮 Police Officer Module
* **Verification Cockpit**: Review incoming complaints, citizen details, incident facts, and inspect uploaded evidence.
* **Verification Actions**:
  * **Verify & Accept**: Mark complaint as `Accepted`, enabling official FIR recording.
  * **Request Information**: Send specific inquiries to citizens (status transitions to `Information Required`).
  * **Reject Grievance**: Record formal statutory rejection reason (silent rejection disabled).
  * **Assign Officer**: Designate Investigating Officer (IO).
* **Official FIR Registration**: Authorized police roles generate unique official FIR numbers (e.g. `FIR/DL/2026/000101`), record legal sections/acts, narrative, accused details, and IO designation.
* **Investigation Case Diary**:
  * Record investigation entries (`Case Diary Entry`, `Evidence Collected`, `Witness Statement`, `Panchnama`, `Chargesheet Filed`, `Closure Report`).
  * Upload official police documents (PDFs, case diary copies).
  * Advance investigation lifecycle status.
* **Station Analytics & Reports**: View category distributions, monthly case volume, resolution rates, and printable station reports.

### 🛠️ Administrator Module
* **System Overview & Analytics**: High-level KPIs, 8-metric grid, interactive Recharts visualizations (Complaints by Month, FIRs by Month, Category Breakdown, Status Distribution, Station Workload).
* **Citizens & Staff Management**: View accounts, search, and toggle active/suspended status.
* **Police Officers Management**: Enroll new officers with badge IDs, rank designations (`Constable`, `Head Constable`, `ASI`, `SI`, `Inspector`, `Admin`), and station postings.
* **Police Station Registry**: Add and edit police stations, assign station codes, phone helplines, and jurisdiction pincodes.
* **Category Master**: Manage complaint categories, descriptions, and active statuses.
* **Forensic Audit Logs**: View immutable audit entries (user, action, entity, old/new values, IP address, timestamp).
* **Portal Settings & AI Roadmap**: View application parameters and AI extensibility architecture.

---

## 3. Technology Stack

### Frontend
* **Core**: React.js 18, Vite 8, React Router v6/v7
* **UI & Styling**: Bootstrap 5.3, Custom Government Prestige CSS Design System
* **Icons**: React Icons (`react-icons/bs`)
* **Charts**: Recharts (Responsive Bar, Pie, Legend, Tooltip)
* **Notifications**: React Toastify
* **HTTP Client**: Axios with JWT request interceptors

### Backend
* **Runtime**: Node.js v24
* **Framework**: Express.js REST API Architecture
* **Authentication**: JWT (`jsonwebtoken`) + Password Hashing (`bcryptjs`)
* **Security**: Helmet, CORS, Express Rate Limit
* **File Processing**: Multer (disk storage, SHA-256 file hash calculation)
* **Email Service**: Nodemailer (with development fallback logger)
* **Logging**: Morgan HTTP Logger + Custom Audit Trail Service

### Database
* **Primary Engine**: PostgreSQL
* **Dual Connector Architecture**:
  * Connects to external PostgreSQL server via `pg` Pool if `DATABASE_URL` is configured.
  * Auto-falls back to embedded persistent WASM PostgreSQL engine (`@electric-sql/pglite`) in `./database/pgdata` if no external database server is reachable — guaranteeing 100% zero-config execution!
* **Schema**: Normalized relational database with foreign keys, indexes, check constraints, and sequence sync.

---

## 4. Pre-Seeded Demo Accounts

The database comes pre-seeded with demo accounts for evaluation. All demo accounts use password: **`Password@123`**.

| Role | Email | Password | Name | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@example.com` | `Password@123` | Rahul Deshmukh | Sample citizen with theft and lost document complaints |
| **Police Officer** | `police@example.com` | `Password@123` | Inspector Vikram Rathore | Senior Inspector at Central Police Station (DL-001) |
| **Police Officer 2** | `subinspector.meena@example.com` | `Password@123` | SI Meena Kumari | Sub-Inspector at Central Police Station |
| **Cyber Officer** | `cyber.verma@example.com` | `Password@123` | Inspector Amit Verma | Cyber Crime Police Station (UP-002) |
| **Administrator** | `admin@example.com` | `Password@123` | Rajesh Sharma (Admin) | National Police HQ Administrator |

> 💡 **Quick Role Switcher:** The portal top bar features a **1-Click Quick Role Switcher** (`Citizen` \| `Police` \| `Admin`) for convenient reviewer testing.

---

## 5. Folder Structure

```text
e-fir-system/
│
├── backend/
│   ├── config/
│   │   ├── db.js                 # Dual-mode PostgreSQL & PGlite connector
│   │   ├── email.js              # Nodemailer email transport & dev fallback
│   │   └── multer.js             # Upload limits, file filters, SHA-256 hash
│   ├── controllers/
│   │   ├── adminController.js    # System analytics, users, officers, stations
│   │   ├── authController.js     # Register, login, profile, password reset
│   │   ├── complaintController.js# Grievance submission, evidence, tracking
│   │   ├── evidenceController.js # Secure streaming download with authorization
│   │   ├── feedbackController.js # Citizen post-closure ratings
│   │   ├── firController.js      # Official FIR registration & lookup
│   │   ├── investigationController.js # Case diary entries & documents
│   │   ├── notificationController.js # User notifications feed
│   │   └── policeController.js   # Verification, info requests, rejection
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & profile resolution
│   │   ├── errorHandler.js       # Centralized safe error handling
│   │   └── rbac.js               # Role-based access control
│   ├── routes/                   # Clean Express REST API endpoints
│   ├── services/
│   │   ├── auditService.js       # Immutable audit logging service
│   │   └── notificationService.js# In-app & email notifications
│   ├── uploads/                  # Dedicated storage (evidence & documents)
│   ├── server.js                 # Main Express server entry point
│   ├── test.js                   # Automated integration test suite
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/client.js         # Axios client with JWT interceptor
│   │   ├── components/           # StatusBadge, VisualTimeline, AcknowledgementSlip, Navbar, Sidebar, Footer, ProtectedRoute
│   │   ├── context/AuthContext.jsx # Authentication state & demo switcher
│   │   ├── pages/
│   │   │   ├── admin/            # Dashboard, ManageUsers, ManageOfficers, ManageStations, ManageCategories, AuditLogs, SystemSettings
│   │   │   ├── citizen/          # CitizenDashboard, SubmitComplaint, MyComplaints, ComplaintDetails, CitizenFIRs, CitizenProfile
│   │   │   ├── police/           # PoliceDashboard, PoliceComplaints, PoliceComplaintDetail, PoliceVerificationQueue, PoliceFIRs, InvestigationDetail, PoliceReports
│   │   │   ├── public/           # Home, Login, Register, TrackPublic, ForgotPassword
│   │   │   └── common/           # NotificationsPage, NotFound
│   │   ├── App.jsx               # Main React router
│   │   ├── main.jsx
│   │   └── index.css             # Government prestige design system
│   ├── vite.config.js            # Proxy configuration to port 5000
│   └── package.json
│
├── database/
│   ├── schema.sql                # 11 Relational tables schema with constraints & indexes
│   └── seed.sql                  # Comprehensive demo data & sequence sync
│
├── .env.example
├── README.md
└── package.json
```

---

## 6. Database Architecture

### Tables Summary

1. **`users`**: User identity, roles (`citizen`, `police`, `admin`), bcrypt password hash, address info.
2. **`police_stations`**: Station codes, address, district, state, phone, email, jurisdiction pincodes.
3. **`officers`**: User linkage, badge/employee ID, rank, station posting, department.
4. **`complaint_categories`**: Grievance categories master list.
5. **`complaints`**: Unique complaint numbers (`E-FIR-2026-XXXXXX`), complainant link, station link, incident details, location, status, rejection reason, info request/response messages.
6. **`evidence`**: Attached files metadata, stored filenames, file size, MIME type, cryptographic SHA-256 hash.
7. **`firs`**: Unique FIR numbers (`FIR/DL/2026/XXXXXX`), complaint linkage, station link, registering officer, legal sections/acts, narrative, accused details, IO link, status.
8. **`investigation_updates`**: Chronological case diary entries, update type, description, attached police documents.
9. **`notifications`**: User notification feed, type, link, read/unread state.
10. **`audit_logs`**: Immutable security trail (user, action, entity, old/new value, IP address, timestamp).
11. **`feedback`**: Post-resolution citizen rating (1-5 stars) and review comments.

---

## 7. Installation & Setup Instructions

### Prerequisites
* Node.js v18 or v20+ installed
* npm package manager

### 1. Installation
Clone the repository and install dependencies:

```bash
# Clone repository
git clone <repository-url>
cd e-fir-system

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default configuration in `.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=efir_super_secure_jwt_secret_key_2026_demo_key
```

### 3. Run Automated Tests
Execute the automated integration test suite:

```bash
npm test
```
*Outputs: 14/14 API integration tests passing.*

### 4. Running the Application

**Option A: Run Backend Server**
```bash
npm run server
# Server starts on http://localhost:5000
# Database (PGlite/PostgreSQL) auto-migrates and seeds demo data on launch!
```

**Option B: Run Frontend App**
```bash
npm run frontend
# Vite dev server opens on http://localhost:5173
```

---

## 8. REST API Documentation Summary

### Authentication API
* `POST /api/auth/register` — Citizen account registration
* `POST /api/auth/login` — Sign in (Email or Mobile + Password)
* `GET /api/auth/profile` — Get active user profile
* `PUT /api/auth/profile` — Update address & contact info
* `PUT /api/auth/change-password` — Password update
* `POST /api/auth/logout` — End session & audit log

### Complaints API
* `POST /api/complaints` — Submit multi-step complaint with evidence files
* `GET /api/complaints` — List complaints (filtered by role & status)
* `GET /api/complaints/:id` — Full complaint details with evidence & timeline
* `POST /api/complaints/:id/evidence` — Attach additional evidence
* `POST /api/complaints/:id/respond` — Citizen response to police information request
* `GET /api/complaints/status/:reference` — Public tracking lookup

### Police Scrutiny & Verification API
* `GET /api/police/dashboard` — Station KPI metrics & chart data
* `PUT /api/police/complaints/:id/verify` — Verify & accept complaint
* `POST /api/police/complaints/:id/request-information` — Request info from citizen
* `PUT /api/police/complaints/:id/reject` — Formally reject complaint with reason
* `PUT /api/police/complaints/:id/assign` — Assign investigating officer

### FIR & Investigation API
* `POST /api/firs` — Register official FIR with legal sections
* `GET /api/firs` — List official FIR records
* `GET /api/firs/:id` — View FIR details & case diary
* `POST /api/investigations/:firId/updates` — Add case diary entry & upload document
* `GET /api/investigations/:firId` — Chronological investigation timeline

### Admin & System API
* `GET /api/admin/dashboard` — System-wide analytics & workload charts
* `GET /api/admin/users` — Manage users & citizens
* `PUT /api/admin/users/:id/status` — Toggle user active/suspended status
* `GET /api/admin/officers` & `POST /api/admin/officers` — Manage police officers
* `GET /api/admin/stations` & `POST /api/admin/stations` — Manage police stations
* `GET /api/admin/audit-logs` — Forensic audit logs viewer

---

## 9. Future AI Extension Architecture

The system is designed with an extensible modular architecture ready for AI integration:

1. **Complaint Classification & Routing**: NLP model to suggest complaint categories based on citizen narratives.
2. **Grievance Summarization**: Generates 3-bullet executive briefs for duty officers highlighting key facts.
3. **Duplicate Complaint Detection**: Vector similarity search to flag potential duplicate complaints across stations.
4. **Multilingual Assistance**: Transcription and translation support across 22 scheduled national languages.

---

## 10. License & Statutory Disclaimers

Developed under the Digital Police Grievance Initiative framework for academic & professional demonstration. All rights reserved.
